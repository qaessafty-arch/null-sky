/**
 * SHARED GAME ENGINE: ChessGameEngine
 * 
 * Implements:
 * - chess.js wrapper
 * - Move execution & validation
 * - Position history (for 3-fold repetition detection)
 * - Timer management & increment handling
 * - PGN generation
 * - Game state serialization
 */

import { Chess, Move } from 'chess.js';

export interface SerializedGameState {
  fen: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
  pgn: string;
  halfMoves: number;
  fullMoves: number;
  history: string[];
  whiteTime: number;
  blackTime: number;
  activeColor: 'white' | 'black';
}

export interface MoveExecutionResult {
  success: boolean;
  move?: Move;
  san?: string;
  fen: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isThreefoldRepetition: boolean;
  error?: string;
}

export class ChessGameEngine {
  private chess: Chess;
  private positionHistory: Map<string, number>;
  private whiteTime: number;
  private blackTime: number;
  private increment: number;
  private timerInterval: any = null;
  private onTimerTick?: (white: number, black: number, active: 'white' | 'black') => void;
  private onTimeout?: (loserColor: 'white' | 'black') => void;

  constructor(initialFen?: string, initialTimeSeconds: number = 600, incrementSeconds: number = 0) {
    this.chess = new Chess(initialFen || undefined);
    this.positionHistory = new Map();
    this.whiteTime = initialTimeSeconds;
    this.blackTime = initialTimeSeconds;
    this.increment = incrementSeconds;

    this.recordCurrentPosition();
  }

  /**
   * Records position without move counters for accurate 3-fold repetition checks
   */
  private recordCurrentPosition(): void {
    const fenKey = this.chess.fen().split(' ').slice(0, 4).join(' ');
    const count = (this.positionHistory.get(fenKey) || 0) + 1;
    this.positionHistory.set(fenKey, count);
  }

  /**
   * Execute a move with validation
   */
  public executeMove(from: string, to: string, promotion: string = 'q'): MoveExecutionResult {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion: promotion as any
      });

      if (!move) {
        return {
          success: false,
          fen: this.chess.fen(),
          isCheck: this.chess.inCheck(),
          isCheckmate: this.chess.isCheckmate(),
          isDraw: this.chess.isDraw(),
          isThreefoldRepetition: this.isThreefold(),
          error: 'Illegal move'
        };
      }

      // Add clock increment to the player who just moved
      if (move.color === 'w') {
        this.whiteTime += this.increment;
      } else {
        this.blackTime += this.increment;
      }

      this.recordCurrentPosition();

      return {
        success: true,
        move,
        san: move.san,
        fen: this.chess.fen(),
        isCheck: this.chess.inCheck(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw: this.chess.isDraw(),
        isThreefoldRepetition: this.isThreefold()
      };
    } catch (err: any) {
      return {
        success: false,
        fen: this.chess.fen(),
        isCheck: this.chess.inCheck(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw: this.chess.isDraw(),
        isThreefoldRepetition: this.isThreefold(),
        error: err?.message || 'Move execution failed'
      };
    }
  }

  /**
   * Check 3-fold repetition using normalized FEN positions
   */
  public isThreefold(): boolean {
    const fenKey = this.chess.fen().split(' ').slice(0, 4).join(' ');
    return (this.positionHistory.get(fenKey) || 0) >= 3;
  }

  /**
   * Timer management
   */
  public startTimer(
    onTick?: (white: number, black: number, active: 'white' | 'black') => void,
    onTimeout?: (loserColor: 'white' | 'black') => void
  ): void {
    this.stopTimer();
    this.onTimerTick = onTick;
    this.onTimeout = onTimeout;

    this.timerInterval = setInterval(() => {
      const turn = this.chess.turn();
      if (turn === 'w') {
        this.whiteTime = Math.max(0, this.whiteTime - 1);
        if (this.whiteTime <= 0) {
          this.stopTimer();
          if (this.onTimeout) this.onTimeout('white');
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - 1);
        if (this.blackTime <= 0) {
          this.stopTimer();
          if (this.onTimeout) this.onTimeout('black');
        }
      }

      if (this.onTimerTick) {
        this.onTimerTick(this.whiteTime, this.blackTime, turn === 'w' ? 'white' : 'black');
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public setClocks(whiteSeconds: number, blackSeconds: number): void {
    this.whiteTime = whiteSeconds;
    this.blackTime = blackSeconds;
  }

  public getClocks(): { white: number; black: number } {
    return { white: this.whiteTime, black: this.blackTime };
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getPgn(): string {
    return this.chess.pgn();
  }

  public getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  public getLegalMoves(square?: string): string[] {
    if (square) {
      const moves = this.chess.moves({ square: square as any, verbose: true });
      return moves.map(m => m.to);
    }
    return this.chess.moves();
  }

  public undo(): boolean {
    const move = this.chess.undo();
    if (move) {
      const fenKey = this.chess.fen().split(' ').slice(0, 4).join(' ');
      const count = this.positionHistory.get(fenKey) || 1;
      if (count <= 1) {
        this.positionHistory.delete(fenKey);
      } else {
        this.positionHistory.set(fenKey, count - 1);
      }
      return true;
    }
    return false;
  }

  public serialize(): SerializedGameState {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      isCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isStalemate: this.chess.isStalemate(),
      isThreefoldRepetition: this.isThreefold(),
      isInsufficientMaterial: this.chess.isInsufficientMaterial(),
      pgn: this.chess.pgn(),
      halfMoves: this.chess.history().length,
      fullMoves: Math.floor(this.chess.history().length / 2) + 1,
      history: this.chess.history(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      activeColor: this.chess.turn() === 'w' ? 'white' : 'black'
    };
  }
}

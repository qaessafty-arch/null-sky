-- FILE: seeds/001_initial_seeds.sql
-- Initial Grandmaster accounts and seeded games

INSERT INTO users (id, username, email, password_hash, display_name, elo_rating, country_code)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Magnus_Carlsen', 'magnus@chess.org', '$2b$12$e8xL8l9P1G1T1R1R1R1R1ezqP.U92837482934892348', 'Magnus Carlsen', 2850, 'NO'),
  ('22222222-2222-2222-2222-222222222222', 'Hikaru_Nakamura', 'hikaru@chess.org', '$2b$12$e8xL8l9P1G1T1R1R1R1R1ezqP.U92837482934892348', 'Hikaru Nakamura', 2835, 'US'),
  ('33333333-3333-3333-3333-333333333333', 'Alireza_Firouzja', 'alireza@chess.org', '$2b$12$e8xL8l9P1G1T1R1R1R1R1ezqP.U92837482934892348', 'Alireza Firouzja', 2805, 'FR')
ON CONFLICT (username) DO NOTHING;

INSERT INTO tournaments (id, name, type, max_players, current_round, status, time_control, prize_pool)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'World Blitz Championship Invitational', 'swiss', 32, 2, 'active', '3+2', 5000.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grand Swiss Open 2026', 'swiss', 64, 1, 'active', '10+0', 10000.00)
ON CONFLICT DO NOTHING;

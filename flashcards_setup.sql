-- 1. Tabela de Decks de Flashcards
CREATE TABLE flashcard_decks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null significa que é oficial/global
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  is_official BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Flashcards
CREATE TABLE flashcards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Revisões (Progresso do Aluno)
CREATE TABLE flashcard_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'new', -- 'new', 'learning', 'review'
  interval REAL DEFAULT 0, -- intervalo em dias
  ease_factor REAL DEFAULT 2.5, -- fator de facilidade (padrão SM-2)
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, card_id)
);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)

-- Decks:
-- Usuários podem ver seus próprios decks OU decks oficiais publicados
CREATE POLICY "Usuários podem ver seus próprios decks ou oficiais publicados" 
ON flashcard_decks FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (is_official = true AND is_published = true)
);

-- Usuários podem inserir seus próprios decks
CREATE POLICY "Usuários podem criar seus próprios decks" 
ON flashcard_decks FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios decks
CREATE POLICY "Usuários podem atualizar seus próprios decks" 
ON flashcard_decks FOR UPDATE 
USING (user_id = auth.uid());

-- Usuários podem deletar seus próprios decks
CREATE POLICY "Usuários podem deletar seus próprios decks" 
ON flashcard_decks FOR DELETE 
USING (user_id = auth.uid());

-- Cards:
-- Usuários podem ver cards de decks que têm acesso
CREATE POLICY "Usuários podem ver cards de decks permitidos" 
ON flashcards FOR SELECT 
USING (
  deck_id IN (
    SELECT id FROM flashcard_decks 
    WHERE user_id = auth.uid() OR (is_official = true AND is_published = true)
  )
);

-- Usuários podem gerenciar cards de seus próprios decks
CREATE POLICY "Usuários podem gerenciar cards de seus decks" 
ON flashcards FOR ALL 
USING (
  deck_id IN (
    SELECT id FROM flashcard_decks WHERE user_id = auth.uid()
  )
);

-- Reviews (Progresso):
-- Usuários só podem ver, inserir, atualizar e deletar suas próprias revisões
CREATE POLICY "Usuários gerenciam apenas suas próprias revisões" 
ON flashcard_reviews FOR ALL 
USING (user_id = auth.uid());

-- Tabela de produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    stock INTEGER DEFAULT 0
);

-- Tabela de categorias
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Inserir categorias
INSERT INTO categories (name) VALUES 
    ('Eletronicos'),
    ('Livros'),
    ('Roupas'),
    ('Alimentos');

-- Gerar 500.000 produtos (descrição compacta para economizar espaço)
INSERT INTO products (name, price, description, stock, category_id)
SELECT 
    'Produto ' || i,
    (random() * 1000 + 10)::DECIMAL(10,2),
    'Descricao do produto numero ' || i,
    (random() * 100)::INTEGER,
    (random() * 3 + 1)::INTEGER
FROM generate_series(1, 500000) AS i;

-- Índices para performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
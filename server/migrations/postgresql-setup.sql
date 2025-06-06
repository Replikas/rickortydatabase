-- PostgreSQL Database Setup for Rick and Morty Database
-- Migration from MongoDB to PostgreSQL

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_-]+$' AND LENGTH(username) >= 3),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
    password VARCHAR(255) NOT NULL CHECK (LENGTH(password) >= 6),
    display_name VARCHAR(50),
    bio VARCHAR(500),
    avatar TEXT, -- URL to avatar image
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    
    -- Preferences (stored as JSONB for flexibility)
    preferences JSONB DEFAULT '{
        "showNSFW": false,
        "theme": "dark",
        "emailNotifications": true
    }'::jsonb,
    
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    ban_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats (stored as JSONB)
    stats JSONB DEFAULT '{
        "totalUploads": 0,
        "totalLikes": 0,
        "totalViews": 0
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) DEFAULT 'Anonymous',
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('art', 'fic')),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT, -- For art only
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Tags stored as array
    tags TEXT[] DEFAULT '{}',
    
    rating VARCHAR(5) DEFAULT 'T' CHECK (rating IN ('G', 'PG', 'T', 'M', 'E', 'XXX')),
    warnings TEXT[] DEFAULT '{}', -- Array of warning types
    description TEXT CHECK (LENGTH(description) <= 2000),
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_anonymized BOOLEAN DEFAULT FALSE,
    
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    uploader_ip INET NOT NULL,
    
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata stored as JSONB for flexibility
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(50) DEFAULT 'Anonymous',
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    likes INTEGER DEFAULT 0,
    
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    author_ip INET NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction tables for many-to-many relationships

-- User favorites
CREATE TABLE user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, content_id)
);

-- User bookmarks
CREATE TABLE user_bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, content_id)
);

-- User follows
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- User blocks
CREATE TABLE user_blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Content likes
CREATE TABLE content_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, content_id)
);

-- Comment likes
CREATE TABLE comment_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- Comment flags
CREATE TABLE comment_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (comment_id, user_id)
);

-- Indexes for performance

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Content indexes
CREATE INDEX idx_content_content_type ON content(content_type);
CREATE INDEX idx_content_uploader_id ON content(uploader_id);
CREATE INDEX idx_content_rating ON content(rating);
CREATE INDEX idx_content_is_nsfw ON content(is_nsfw);
CREATE INDEX idx_content_is_active ON content(is_active);
CREATE INDEX idx_content_flagged ON content(flagged);
CREATE INDEX idx_content_created_at ON content(created_at DESC);
CREATE INDEX idx_content_likes ON content(likes DESC);
CREATE INDEX idx_content_views ON content(views DESC);
CREATE INDEX idx_content_tags ON content USING GIN(tags);
CREATE INDEX idx_content_title_search ON content USING GIN(to_tsvector('english', title));

-- Comments indexes
CREATE INDEX idx_comments_content_id ON comments(content_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_flagged ON comments(flagged);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_content_created ON comments(content_id, created_at DESC);

-- Junction table indexes
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_content_id ON user_favorites(content_id);
CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_content_id ON user_bookmarks(content_id);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_content_likes_content_id ON content_likes(content_id);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for maintaining like counts
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE content SET likes = likes + 1 WHERE id = NEW.content_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE content SET likes = likes - 1 WHERE id = OLD.content_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes = likes - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers for maintaining like counts
CREATE TRIGGER content_likes_count_trigger
    AFTER INSERT OR DELETE ON content_likes
    FOR EACH ROW EXECUTE FUNCTION update_content_likes_count();

CREATE TRIGGER comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Views for common queries

-- User stats view
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT c.id) as upload_count,
    COUNT(DISTINCT cl.content_id) as likes_given,
    COUNT(DISTINCT f1.following_id) as following_count,
    COUNT(DISTINCT f2.follower_id) as followers_count
FROM users u
LEFT JOIN content c ON u.id = c.uploader_id AND c.is_active = true
LEFT JOIN content_likes cl ON u.id = cl.user_id
LEFT JOIN user_follows f1 ON u.id = f1.follower_id
LEFT JOIN user_follows f2 ON u.id = f2.following_id
WHERE u.is_active = true
GROUP BY u.id, u.username;

-- Content with stats view
CREATE VIEW content_with_stats AS
SELECT 
    c.*,
    u.username as uploader_username,
    COUNT(DISTINCT cm.id) as comment_count,
    COUNT(DISTINCT cl.user_id) as like_count,
    COUNT(DISTINCT ub.user_id) as bookmark_count
FROM content c
LEFT JOIN users u ON c.uploader_id = u.id
LEFT JOIN comments cm ON c.id = cm.content_id AND cm.is_deleted = false
LEFT JOIN content_likes cl ON c.id = cl.content_id
LEFT JOIN user_bookmarks ub ON c.id = ub.content_id
WHERE c.is_active = true
GROUP BY c.id, u.username;

-- Comments with replies view
CREATE VIEW comments_with_replies AS
SELECT 
    c.*,
    u.username as author_username,
    COUNT(DISTINCT r.id) as reply_count,
    COUNT(DISTINCT cl.user_id) as like_count
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
LEFT JOIN comments r ON c.id = r.parent_comment_id AND r.is_deleted = false
LEFT JOIN comment_likes cl ON c.id = cl.comment_id
WHERE c.is_deleted = false
GROUP BY c.id, u.username;

-- Insert default admin user (optional)
-- INSERT INTO users (username, email, password, role, display_name)
-- VALUES ('admin', 'admin@rickandmorty.com', '$2a$10$encrypted_password_here', 'admin', 'Administrator');

COMMIT;
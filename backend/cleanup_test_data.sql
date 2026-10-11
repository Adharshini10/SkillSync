-- ============================================================
-- SkillSync – Cleanup Script for Dummy / Test Data
-- Preserves specified real user accounts and purges all test data
-- ============================================================

USE skillsync;

-- Set the list of user IDs or emails to PRESERVE:
-- 48  -> adharshini@gmail.com
-- 176 -> anu@gmail.com
-- 185 -> naga@gmail.com

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Project Chat Messages
DELETE FROM project_chat_messages 
WHERE sender_id NOT IN (48, 176, 185) 
   OR project_id NOT IN (SELECT id FROM projects WHERE owner_id IN (48, 176, 185));

-- 2. Project Members
DELETE FROM project_members 
WHERE user_id NOT IN (48, 176, 185) 
   OR project_id NOT IN (SELECT id FROM projects WHERE owner_id IN (48, 176, 185));

-- 3. Project Skills
DELETE FROM project_skills 
WHERE project_id NOT IN (SELECT id FROM projects WHERE owner_id IN (48, 176, 185));

-- 4. Projects
DELETE FROM projects 
WHERE owner_id NOT IN (48, 176, 185);

-- 5. Chat Messages (1-to-1)
DELETE FROM chat_messages 
WHERE sender_id NOT IN (48, 176, 185) 
   OR receiver_id NOT IN (48, 176, 185);

-- 6. Connections
DELETE FROM connections 
WHERE sender_id NOT IN (48, 176, 185) 
   OR receiver_id NOT IN (48, 176, 185);

-- 7. Notifications
DELETE FROM notifications 
WHERE recipient_id NOT IN (48, 176, 185) 
   OR actor_id NOT IN (48, 176, 185);

-- 8. User Skills & Learning Skills
DELETE FROM user_skills 
WHERE user_id NOT IN (48, 176, 185);

DELETE FROM user_learning_skills 
WHERE user_id NOT IN (48, 176, 185);

-- 9. Profiles
DELETE FROM profiles 
WHERE user_id NOT IN (48, 176, 185);

-- 10. Users
DELETE FROM users 
WHERE id NOT IN (48, 176, 185);

SET FOREIGN_KEY_CHECKS = 1;

-- Verification
SELECT 'users' AS tbl, COUNT(*) AS count FROM users
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'connections', COUNT(*) FROM connections
UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages;

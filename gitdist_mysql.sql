-- ============================================================
-- GitDist - GitHub 应用更新分发平台 MySQL 数据库初始化脚本
-- 兼容 MySQL 5.7 / MySQL 8.0+ / MariaDB
-- 字符集: utf8mb4, 排序规则: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS `gitdist` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gitdist`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. 管理员与系统用户表 (users)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户主键ID',
  `username` VARCHAR(64) NOT NULL UNIQUE COMMENT '登录用户名',
  `password_hash` VARCHAR(128) NOT NULL COMMENT '加盐哈希密码',
  `salt` VARCHAR(64) NOT NULL COMMENT '密码随机盐值',
  `role` VARCHAR(32) DEFAULT 'admin' COMMENT '角色: admin',
  `created_at` DATETIME NOT NULL COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL COMMENT '最后更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台管理员用户表';

-- ------------------------------------------------------------
-- 2. 应用项目表 (apps)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `apps`;
CREATE TABLE `apps` (
  `id` VARCHAR(64) PRIMARY KEY COMMENT '应用唯一标识 Slug (如: my-app)',
  `name` VARCHAR(128) NOT NULL COMMENT '应用名称',
  `description` TEXT COMMENT '应用描述说明',
  `github_repo` VARCHAR(128) NOT NULL COMMENT 'GitHub仓库路径 (owner/repo)',
  `github_token` VARCHAR(255) DEFAULT '' COMMENT 'GitHub Personal Access Token',
  `webhook_secret` VARCHAR(128) NOT NULL COMMENT 'Webhook HMAC SHA256 签名密钥',
  `acceleration_proxy` VARCHAR(255) DEFAULT 'https://ghfast.top/' COMMENT '下载加速代理镜像线路',
  `created_at` DATETIME NOT NULL COMMENT '接入时间',
  `updated_at` DATETIME NOT NULL COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户端应用表';

-- ------------------------------------------------------------
-- 3. 版本发布表 (releases)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `releases`;
CREATE TABLE `releases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '发布主键ID',
  `app_id` VARCHAR(64) NOT NULL COMMENT '关联应用ID',
  `version` VARCHAR(64) NOT NULL COMMENT '语义化版本号 (如 1.2.0)',
  `tag_name` VARCHAR(64) NOT NULL COMMENT 'Git Tag 名称 (如 v1.2.0)',
  `release_name` VARCHAR(255) DEFAULT '' COMMENT '发布版本标题',
  `changelog` MEDIUMTEXT COMMENT '更新说明日志 (Markdown)',
  `channel` VARCHAR(32) DEFAULT 'stable' COMMENT '分发渠道: stable / beta / nightly',
  `is_mandatory` TINYINT(1) DEFAULT 0 COMMENT '是否强制更新: 1=强制, 0=常规',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用分发: 1=启用, 0=暂停',
  `rollout_percentage` INT DEFAULT 100 COMMENT '灰度推送比例: 0-100',
  `github_release_id` BIGINT DEFAULT NULL COMMENT 'GitHub Release 内部编号',
  `github_html_url` VARCHAR(255) DEFAULT '' COMMENT 'GitHub页面链接',
  `published_at` DATETIME NOT NULL COMMENT '版本发布时间',
  `created_at` DATETIME NOT NULL COMMENT '录入时间',
  `updated_at` DATETIME NOT NULL COMMENT '更新时间',
  INDEX `idx_app_version` (`app_id`, `version`),
  INDEX `idx_app_active` (`app_id`, `is_active`),
  CONSTRAINT `fk_releases_app` FOREIGN KEY (`app_id`) REFERENCES `apps` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='版本发版记录表';

-- ------------------------------------------------------------
-- 4. 安装包与产物资产表 (release_assets)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `release_assets`;
CREATE TABLE `release_assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '资产主键ID',
  `release_id` INT NOT NULL COMMENT '所属发布ID',
  `platform` VARCHAR(64) NOT NULL COMMENT '目标平台 (windows_x64, mac_arm64, universal 等)',
  `file_name` VARCHAR(255) NOT NULL COMMENT '安装包文件名',
  `file_size` BIGINT DEFAULT 0 COMMENT '文件字节大小',
  `file_sha256` VARCHAR(64) DEFAULT '' COMMENT '文件 SHA256 校验和防篡改哈希',
  `download_url` TEXT NOT NULL COMMENT '原始下载链接 (GitHub Assets URL)',
  `content_type` VARCHAR(128) DEFAULT '' COMMENT '文件 MIME 类型',
  `download_count` INT DEFAULT 0 COMMENT '累计下载分发次数',
  `created_at` DATETIME NOT NULL COMMENT '创建时间',
  INDEX `idx_release_platform` (`release_id`, `platform`),
  CONSTRAINT `fk_assets_release` FOREIGN KEY (`release_id`) REFERENCES `releases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分发产物资产表';

-- ------------------------------------------------------------
-- 5. 客户端下载与升级日志表 (download_logs)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `download_logs`;
CREATE TABLE `download_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志主键ID',
  `app_id` VARCHAR(64) NOT NULL COMMENT '应用ID',
  `version` VARCHAR(64) NOT NULL COMMENT '下载的版本号',
  `platform` VARCHAR(64) NOT NULL COMMENT '请求平台',
  `ip` VARCHAR(64) DEFAULT '' COMMENT '客户端IP',
  `user_agent` VARCHAR(255) DEFAULT '' COMMENT '客户端UA',
  `client_id` VARCHAR(128) DEFAULT '' COMMENT '客户端机器标识',
  `timestamp` DATETIME NOT NULL COMMENT '下载时间',
  INDEX `idx_logs_app_time` (`app_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分发统计日志表';

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 预置默认超级管理员 (用户名: admin, 初始密码: admin123)
-- ------------------------------------------------------------
-- 哈希算法: PBKDF2 with SHA256, 1000 次迭代
-- salt: d9f8a4e1b2c3d4e5f6a7b8c9d0e1f2a3
-- password: admin123 -> password_hash
INSERT INTO `users` (`username`, `password_hash`, `salt`, `role`, `created_at`, `updated_at`)
VALUES (
  'admin',
  'a49a901bfc10768d1b31d3ded3c3ccdb5115079c90104e02483a85ea7caab69021a09a7d2e9e8187fd10d13da42467062ce158e021d452edb6e2870a8ddc020e',
  'd9f8a4e1b2c3d4e5f6a7b8c9d0e1f2a3',
  'admin',
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE `username`=`username`;

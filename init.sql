-- 通讯录数据库初始化脚本
-- 使用方法：在MySQL命令行或phpMyAdmin中执行此脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `contacts_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `contacts_db`;

-- 创建联系人表
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '主电话号码',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '主邮箱',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  `notes` TEXT DEFAULT NULL COMMENT '备注',
  `is_favorite` TINYINT(1) DEFAULT 0 COMMENT '是否收藏(0:否,1:是)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_favorite` (`is_favorite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系人表';

-- 创建联系方式表(支持多种联系方式)
CREATE TABLE IF NOT EXISTS `contact_methods` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `contact_id` INT(11) NOT NULL COMMENT '联系人ID',
  `method_type` VARCHAR(20) NOT NULL COMMENT '联系方式类型(phone/email/wechat/qq/weibo/address)',
  `method_value` VARCHAR(255) NOT NULL COMMENT '联系方式值',
  `label` VARCHAR(50) DEFAULT NULL COMMENT '标签(如:工作/家庭/其他)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_contact_id` (`contact_id`),
  INDEX `idx_method_type` (`method_type`),
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系方式表';

-- 插入示例数据
INSERT INTO `contacts` (`name`, `phone`, `email`, `address`, `notes`) VALUES
('张三', '13800138000', 'zhangsan@example.com', '北京市朝阳区', '老朋友'),
('李四', '13900139000', 'lisi@example.com', '上海市浦东新区', '同事'),
('王五', '13700137000', 'wangwu@example.com', '广州市天河区', '客户');

-- 显示创建结果
SELECT '数据库初始化成功！' AS message;
SELECT * FROM `contacts`;


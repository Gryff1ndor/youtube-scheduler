-- ==============================================================================
-- Analytics App: Oracle Database Schema & PL/SQL Setup Script
-- Compatible with Oracle 11g/12c/19c/21c+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table Definitions
-- ------------------------------------------------------------------------------

-- Users Table (Synced with NextAuth profiles)
CREATE TABLE users (
    id VARCHAR2(255) PRIMARY KEY,
    name VARCHAR2(255),
    email VARCHAR2(255) UNIQUE NOT NULL,
    image VARCHAR2(500),
    youtube_channel_id VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Channel Metrics (Designed for 28-day analytics rolling storage)
CREATE TABLE channel_metrics (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id VARCHAR2(255) NOT NULL,
    metric_date DATE NOT NULL,
    views NUMBER DEFAULT 0 NOT NULL,
    watch_time_hours NUMBER DEFAULT 0 NOT NULL,
    subscribers_gained NUMBER DEFAULT 0 NOT NULL,
    subscribers_lost NUMBER DEFAULT 0 NOT NULL,
    estimated_revenue NUMBER(10, 2) DEFAULT 0 NOT NULL,
    average_view_duration NUMBER DEFAULT 0 NOT NULL, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_metrics_unique UNIQUE (channel_id, metric_date)
);

-- Index for faster querying by channel and date
CREATE INDEX idx_channel_metrics_date ON channel_metrics(channel_id, metric_date);

-- Scheduled Uploads
CREATE TABLE scheduled_uploads (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR2(255) NOT NULL,
    video_title VARCHAR2(255) NOT NULL,
    video_description CLOB,
    privacy_status VARCHAR2(50) DEFAULT 'private' NOT NULL, -- private, unlisted, public
    scheduled_time TIMESTAMP NOT NULL,
    youtube_video_id VARCHAR2(255),
    upload_status VARCHAR2(50) DEFAULT 'pending' NOT NULL, -- pending, uploading, success, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_scheduled_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 2. PL/SQL Packages for Analytics Aggregation
-- ------------------------------------------------------------------------------

-- Package Specification
CREATE OR REPLACE PACKAGE analytics_pkg AS
    -- Define a Ref Cursor type for returning result sets
    TYPE t_cursor IS REF CURSOR;

    -- Procedure to aggregate the last 28 days of metrics for a channel
    PROCEDURE get_28_day_summary(
        p_channel_id IN VARCHAR2,
        p_result OUT t_cursor
    );

    -- Procedure to sync/upsert daily metrics from external API
    PROCEDURE sync_daily_metrics(
        p_channel_id IN VARCHAR2,
        p_metric_date IN DATE,
        p_views IN NUMBER,
        p_watch_time IN NUMBER,
        p_subs_gained IN NUMBER,
        p_subs_lost IN NUMBER,
        p_revenue IN NUMBER,
        p_avg_duration IN NUMBER
    );
END analytics_pkg;
/

-- Package Body
CREATE OR REPLACE PACKAGE BODY analytics_pkg AS

    -- Implementation of 28-day summary aggregation
    PROCEDURE get_28_day_summary(
        p_channel_id IN VARCHAR2,
        p_result OUT t_cursor
    ) IS
    BEGIN
        OPEN p_result FOR
            SELECT 
                SUM(views) AS total_views,
                SUM(watch_time_hours) AS total_watch_time,
                SUM(subscribers_gained) - SUM(subscribers_lost) AS net_subscribers,
                SUM(estimated_revenue) AS total_revenue,
                -- Safe average calculation
                CASE 
                    WHEN SUM(views) > 0 THEN ROUND(SUM(average_view_duration * views) / SUM(views), 2)
                    ELSE 0 
                END AS global_average_view_duration,
                MIN(metric_date) AS start_date,
                MAX(metric_date) AS end_date
            FROM channel_metrics
            WHERE channel_id = p_channel_id
              AND metric_date >= TRUNC(SYSDATE) - 28;
    END get_28_day_summary;

    -- Implementation of daily metrics upsert
    PROCEDURE sync_daily_metrics(
        p_channel_id IN VARCHAR2,
        p_metric_date IN DATE,
        p_views IN NUMBER,
        p_watch_time IN NUMBER,
        p_subs_gained IN NUMBER,
        p_subs_lost IN NUMBER,
        p_revenue IN NUMBER,
        p_avg_duration IN NUMBER
    ) IS
    BEGIN
        -- Standard MERGE statement (Upsert logic)
        MERGE INTO channel_metrics tgt
        USING (SELECT p_channel_id AS channel_id, TRUNC(p_metric_date) AS metric_date FROM DUAL) src
        ON (tgt.channel_id = src.channel_id AND tgt.metric_date = src.metric_date)
        WHEN MATCHED THEN
            UPDATE SET 
                tgt.views = p_views,
                tgt.watch_time_hours = p_watch_time,
                tgt.subscribers_gained = p_subs_gained,
                tgt.subscribers_lost = p_subs_lost,
                tgt.estimated_revenue = p_revenue,
                tgt.average_view_duration = p_avg_duration
        WHEN NOT MATCHED THEN
            INSERT (channel_id, metric_date, views, watch_time_hours, subscribers_gained, subscribers_lost, estimated_revenue, average_view_duration)
            VALUES (p_channel_id, TRUNC(p_metric_date), p_views, p_watch_time, p_subs_gained, p_subs_lost, p_revenue, p_avg_duration);
            
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END sync_daily_metrics;

END analytics_pkg;
/

-- Verify Package compilation
SHOW ERRORS PACKAGE analytics_pkg;
SHOW ERRORS PACKAGE BODY analytics_pkg;

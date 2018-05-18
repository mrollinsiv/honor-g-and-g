CREATE TABLE data (
    id integer NOT NULL,
    key text NOT NULL,
    value jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

INSERT INTO "data"("id","key","value","created_at","updated_at")
VALUES
(9,E'races',E'[]',NOW(),NOW()),
(10,E'insta_pics',E'{}',NOW(),NOW()),
(17,E'fundraising_data',E'{}',NOW(),NOW());
CREATE TABLE data (
    id integer NOT NULL,
    key text NOT NULL,
    value jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE SEQUENCE data_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE data_id_seq OWNED BY data.id;
ALTER TABLE ONLY data ALTER COLUMN id SET DEFAULT nextval('data_id_seq'::regclass);
ALTER TABLE ONLY data
    ADD CONSTRAINT data_pkey PRIMARY KEY (id);

INSERT INTO "data"("id","key","value","created_at","updated_at")
VALUES
(9,E'races',E'[]',NOW(),NOW()),
(10,E'insta_pics',E'{}',NOW(),NOW()),
(17,E'fundraising_data',E'{}',NOW(),NOW());
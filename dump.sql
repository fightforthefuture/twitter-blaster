
CREATE TABLE _twitter_user
(
  id bigserial NOT NULL,
  social_user_id character varying,
  username character varying(255),
  name character varying,
  avatar_url character varying(255),
  avatar_url_s3 character varying(255),
  create_date timestamp with time zone DEFAULT now(),
  mod_date timestamp with time zone,
  access_token character varying(255)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE _twitter_user
  OWNER TO postgres;

-- Index: access_token

-- DROP INDEX access_token;

CREATE INDEX access_token
  ON _twitter_user
  USING btree
  (access_token COLLATE pg_catalog."default");

-- Index: social_user_id

-- DROP INDEX social_user_id;

CREATE UNIQUE INDEX social_user_id
  ON _twitter_user
  USING btree
  (social_user_id COLLATE pg_catalog."default");



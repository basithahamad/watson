-- Watson & Watson Associates — MySQL 8 schema.
--
-- Page copy lives in site_content as one JSON document per section. That copy is
-- genuinely document-shaped (nested, heterogeneous, arrays of differing shape),
-- and splitting it into columns would recreate the key-value sprawl this schema
-- exists to avoid. Speakers and testimonials are real rows, because they are.
--
-- Apply with `npm run db:migrate` (idempotent).

CREATE TABLE IF NOT EXISTS site_content (
  section    VARCHAR(64) NOT NULL,
  data       JSON        NOT NULL,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS speakers (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(160) NOT NULL,
  name       VARCHAR(200) NOT NULL,
  `role`     VARCHAR(200) NOT NULL DEFAULT '',
  bio        TEXT         NOT NULL,
  topics     JSON         NOT NULL,
  -- A public URL (/uploads/<hash>.jpg), never image bytes.
  image_url  VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_speakers_slug (slug),
  KEY idx_speakers_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(160) NOT NULL,
  quote      TEXT         NOT NULL,
  name       VARCHAR(200) NOT NULL DEFAULT '',
  title      VARCHAR(200) NOT NULL DEFAULT '',
  image_url  VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_testimonials_slug (slug),
  KEY idx_testimonials_sort (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Database migrations & initialization

This folder contains versioned SQL migrations for the ClusterGenie app.

How it works
------------
- Migrations are stored in `database/migrations/` and follow the golang-migrate format (versioned `.up.sql` and `.down.sql`).
- They are intended to be a single source of truth for schema changes (use these instead of editing `database/init.sql` directly).

Running migrations (dev)
------------------------

1) Start the local docker-compose stack so MySQL is available and exposed on localhost:3306:

```bash
docker-compose up -d mysql
```

2) Run migrations using the `migrate` docker image (host.docker.internal or localhost works depending on your platform):

```bash
# Default MySQL creds used in docker-compose
make migrate-up MYSQL_HOST=host.docker.internal MYSQL_PORT=3306 MYSQL_USER=root MYSQL_PASSWORD=rootpassword MYSQL_DATABASE=clustergenie
```

If you have `migrate` installed locally, you can run:

```bash
migrate -path ./database/migrations -database "mysql://root:rootpassword@tcp(localhost:3306)/clustergenie?multiStatements=true" up
```

Rollbacks / Force
-----------------
- Roll back the last migration:

```bash
make migrate-down
```

- Force the migration version (advanced / CI recoveries):

```bash
make migrate-force VERSION=<number>
```

CI
--
In CI, add a step that runs the `migrate` binary or the docker image to apply migrations before running tests that depend on the schema.

Notes
-----
- `database/init.sql` remains in the repo for convenience; it is recommended to move any changes into versioned SQL files under `database/migrations/` so changes are reproducible and reversible.
- The initial migration includes index lengths for TEXT columns where appropriate to avoid MySQL error 1170 (BLOB/TEXT column used in key specification without a key length).

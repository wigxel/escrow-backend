# Nitro starter


# Tools
Postgres
Tigerbettle

### Setup Tigerbettle
#### Install & Setup locally
Follow the quick guide and set tigerbettle running locally.
https://docs.tigerbeetle.com/quick-start/#1-download-tigerbeetle
Ensure the tigerbeetle command can be accessed from all directories.

#### Start local cluster
Run the command below to create a cluster.
```bash
> tigerbeetle format --cluster=0 --replica=0 --replica-count=1 --development 0_0_escrow_app.tigerbeetle
```

Run the command below to start the server
```bash
> pnpm start:tigerbeetle
```

Look at the [nitro quick start](https://nitro.unjs.io/guide#quick-start) to learn more how to get started.

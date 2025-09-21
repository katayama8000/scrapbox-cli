# Scrapbox CLI

This CLI allows you to control Scrapbox directly from your terminal.

## Setup and Usage

1. **Clone the Repository**

   ```bash
   git clone https://github.com/katayama8000/scrapbox-cli
   cd scrapbox-cli
   ```

2. **Install Dependencies**

   ```bash
   yarn install
   ```

3. **Configure Environment**

   - Copy `.env.dist` to `.env` and set your Scrapbox Session ID in `.env`:
     ```bash
     cp .env.dist .env
     ```

4. **Run Commands**

   - For daily updates:
     ```bash
     yarn daily
     ```
   - For weekly updates:
     ```bash
     yarn weekly
     ```
   - To post a sleep log:
     ```bash
     yarn sleepLog
     ```
   - To calculate the average wake-up time:
     ```bash
     yarn wake
     ```

5. **Run on GitHub Actions**

   - set secrets in your repository settings:
     - `SCRAPBOX_SID`
     - `DISCORD_WEBHOOK`
     - `BACKLOG_API_KEY`
   - Enable GitHub Actions in your repository.

## Architecture

This project follows a Clean Architecture pattern. For more details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Development

This project uses `ts-node` to run TypeScript files directly without pre-compiling them. Path aliases from `tsconfig.json` are resolved at runtime using `tsconfig-paths`.

All scripts are defined in `package.json` and can be run with `yarn <script_name>`.


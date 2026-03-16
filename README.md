# QuickInstall Extension for Pterodactyl

This is an open-source **Blueprint extension** for Pterodactyl that adds a handy **Plugins** tab right inside your server panel. With it, you can browse, search, and install plugins straight from **Modrinth** and **SpigotMC** — no need to leave the dashboard.

No more downloading files by hand or uploading things manually. Just pick what you need, hit install, and you’re set.

---

## Features

* 📚 Browse and install Modrinth plugins right in your dashboard.
* 🔍 Filter by name, Minecraft version, or loader.
* ⬇️ One-click plugin installs.
* 🛠️ Manage plugins from a dedicated tab.
* 🔒 Server permission checks before install.
* 🎨 Modern, responsive React UI.
* 🆓 Free and open source.

---

## 🚧 Coming Soon

Planned features for upcoming releases:

* Support for SpigotMC direct installs.
* Plugin update notifications in the dashboard.
* Bulk (multi-select) plugin installs and removals.
* Enhanced plugin compatibility checks.
* Configurable plugin source filtering.
* Advanced search and categorization.
* Automatic dependency resolution.

> I don't know what is implemented yet. lol this is a fork of an addon a friend made

---

## Folder Structure

The extension uses the usual Blueprint project structure:

```markdown
quickinstall/
├── conf.yml
├── app/
│   └── Http/
│       └── Controllers/
│           └── Extensions/
│               └── QuickInstall/
│                   └── PluginController.php
├── resources/
│   └── scripts/
│       └── components/
│           └── server/
│               └── modrinth/
│                   └── QuickInstallContainer.tsx
└── routes/
    └── server.php
```

### Quick Overview

* `conf.yml`: Extension metadata & config
* `PluginController.php`: Handles download & validation
* `QuickInstallContainer.tsx`: UI code (React)
* `server.php`: Blueprint routes

---

## Requirements

To get this extension running, you'll need:

* The Pterodactyl Panel with Blueprint support
* Blueprint installed
* PHP 8 or newer
* Outbound network access to:
  * `api.modrinth.com`
  * `cdn.modrinth.com`

---

## Installation (Recommended)

The installation works best with the Blueprint package manager.

---

### 1. Download the Latest LTS Release

1. Go to this repo's GitHub Releases page.
2. Download the most recent **LTS** release:

   ```text
   quickinstall.blueprint
   ```

   If the download has a version in the filename, you can rename it to the above if you prefer.

---

### 2. Upload to Your Pterodactyl Directory

Put the `quickinstall.blueprint` file in your Pterodactyl root folder:

```text
/var/www/pterodactyl
```

You can upload using SFTP, SCP, your file manager, or (less ideally) FTP.

Example:

```sh
scp QuickInstall.blueprint user@server:/var/www/pterodactyl/
```

---

### 3. Install the Extension

1. SSH into your server.
2. Run:

   ```sh
   cd /var/www/pterodactyl
   blueprint -i QuickInstall.blueprint
   ```

3. After installing, clear caches and rebuild assets if necessary:

   ```sh
   php artisan optimize:clear
   php artisan view:clear
   ```

4. If your setup requires it, restart your panel services.

---

## Uninstalling

To remove the extension, run:

```sh
cd /var/www/pterodactyl
blueprint -remove QuickInstall.blueprint
```

Don't forget to clear the cache afterwards:

```sh
php artisan optimize:clear
```

---

## Updating

Just uninstall the old version and install the new one. Here’s a quick process:

### Recommended Update Process

1. Remove the old version:

   ```sh
   blueprint -remove QuickInstall.blueprint
   ```

2. Download the latest LTS release from GitHub.
3. Upload the new file to `/var/www/pterodactyl`.
4. Install again:

   ```sh
   blueprint -i QuickInstall.blueprint
   ```

5. Clear cache:

   ```sh
   php artisan optimize:clear
   ```

6. Restart your panel services if needed.

---

## How it Works

### Frontend

The panel interface lives here:

```text
resources/scripts/components/server/modrinth/QuickInstallContainer.tsx
```

It's all React + Tailwind, talking to the backend and Modrinth’s API.

### Backend

This is the controller doing the heavy lifting:

```text
app/Http/Controllers/Extensions/QuickInstall/PluginController.php
```

**Features:**

* Checks and validates requests.
* Verifies your user and server permissions.
* Streams plugin files securely.
* Places plugins in the correct server folder.

### Security

* Enforces `file.create` permission checks.
* Validates all project and version IDs.
* Prevents directory traversal attacks.
* Uses Pterodactyl's built-in storage APIs.

---

## 🛠️ Developing & Local Testing

To run locally, place the extension in:

```text
.blueprint/extensions/QuickInstall
```

Then use:

```sh
blueprint -i QuickInstall
```

Most changes will hot reload automatically.

---

## Contributing

Pull requests, bug reports, and feature ideas are all welcome. Contributions of any size help keep this project healthy.

#### Typical ways to help

* Report bugs
* Fix typos or improve documentation
* Submit pull requests
* Suggest new features

Please follow the usual GitHub workflow and check for open issues first.

---

## License

Open source under the terms of the `LICENSE` file.

---

## Acknowledgements

* Modrinth API & team
* The Pterodactyl contributors
* Blueprint Framework maintainers
* Everyone else who has contributed

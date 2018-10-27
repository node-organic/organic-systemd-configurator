# organic-systemd-configurator

A cell which is maintaining registry of systemd services.

* (!) It is executed as root user to be able to configure systemd. 
* It is restarted on failure or reboot.
* It is installed on host machines via script.
* It uses `organic-plasma-channel` to receive chemicals

## pre-requirements

* `ssh` access as root to a VPS with NGINX
* `scp`

## install

At your local command line execute

```
$ npx node-organic/organic-systemd-configurator <remote-ip>
```

## cell control chemicals

#### onCellMitosisComplete

```
{
  type: "control",
  action: "onCellMitosisComplete",
  cellInfo: {
    name: String,
    cwd: String,
    version: String,
    nodeVersion: String,
    port: Number,
    mountpoint: String,
    domain: String,
    mitosis: {
      mode: String,
      aptosis: {
        versionConditions: [String]
      },
      count: Number
    }
  }
}
```

#### onCellAptosisComplete

```
{
  type: "control",
  action: "onCellAptosisComplete",
  cellInfo: {
    name: String,
    version: String
  }
}
```

## howto

### set custom organic-systemd-configurator dna

1. create `dna/cells/organic-systemd-configurator.json`
2. execute `$ npx organic-systemd-configurator install <remote-ip>`

### set custom systemd conf

1. create `dna/cells/organic-systemd-configurator.json` with content:

  ```
  {
    "build": {
      "templatePath": "./current/working/directory/relative/path.ejs"
    }
  }
  ```
  
2. execute `$ npx organic-systemd-configurator install <remote-ip>`

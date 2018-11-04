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

or with custom ejs template

```
$ npx node-organic/organic-systemd-configurator <remote-ip> <path-to-systemd-ejs-template>
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
    mitosis: {
      mode: String,
      apoptosis: {
        versionConditions: [String]
      },
      count: Number
    }
  }
}
```

#### onCellApoptosisComplete

```
{
  type: "control",
  action: "onCellApoptosisComplete",
  cellInfo: {
    name: String,
    version: String
  }
}
```

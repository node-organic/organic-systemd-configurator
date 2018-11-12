# organic-systemd-configurator

A cell which is maintaining registry of systemd services on all registered cells

* (!) It is executed as root user to be able to configure systemd. 
* It is restarted on failure or reboot.
* It is installed on host machines via script.
* It uses host machine's directory with cell deployments metadata to update accordingly systemd cells services

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
$ npx node-organic/organic-systemd-configurator <remote-ip> <path-to-dir-with-systemd-ejs-template>
```


## cell deployment metadata

A json file containing the following structure.

```
{
  name: String
  version: String,
  mode: String,
  nodeVersion: String
}
```

Any `.json` file found (or created) at deployment directory is used to build proxy rules.
Removing the file will remove the according proxy rules.

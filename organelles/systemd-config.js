const fs = require('fs')
const ejs = require('ejs')
const exec = require('../lib/exec')
const path = require('path')
const semverDiff = require('semver-diff')

module.exports = class {
  constructor (plasma, dna) {
    this.plasma = plasma
    this.dna = dna
    this.templatePromise = this.loadTemplate()
    this.runningCells = []
    try {
      this.runningCells = require(path.join(process.cwd(), 'running-cells-store.json'))
    } catch (e) {}
    if (dna.channel) {
      this.plasma.on({
        type: 'control',
        channel: dna.channel.name
      }, this.handleChemical, this)
    }
  }
  async loadTemplate () {
    let promise = new Promise((resolve, reject) => {
      fs.readFile(this.dna.templatePath, (err, data) => {
        if (err) return reject(err)
        console.info('template loaded...')
        resolve(data.toString())
      })
    })
    return promise
  }
  handleChemical (c, next) {
    if (!this[c.action]) return next(new Error(c.action + ' action not found'))
    this[c.action](c, next)
  }
  onCellMitosisComplete (c, next) {
    if (!c.cellInfo) return
    this.enableCellService(c.cellInfo)
    next()
  }
  onCellAptosisProposal (c, next) {
    if (!c.cellInfo) return
    this.disableCellService(c.cellInfo)
    next()
  }
  async enableCellService (cellInfo) {
    let serviceFilePath = this.getCellServicePath(cellInfo)
    this.templatePromise.then(async (template) => {
      let serviceContent = ejs.render(template, cellInfo)
      await writeFile(serviceFilePath, serviceContent)
      console.info('wrote', serviceFilePath)
      await this.systemctl('enable', cellInfo)
      await this.systemctl('start', cellInfo)
      await this.flushLegacyCells(cellInfo)
      this.runningCells.push(cellInfo)
      await this.updateStore()
    })
  }
  flushLegacyCells (cellInfo) {
    for (let i = 0; i < this.runningCells.length; i++) {
      let legacy_cell = this.runningCells[i]
      if (legacy_cell.name === cellInfo.name &&
        is_version_legacy(legacy_cell.mitosis.aptosis.versionConditions, legacy_cell.version, cellInfo.version)) {
        this.disableCellService(legacy_cell)
        i -= 1
      }
    }
  }
  async disableCellService (cellInfo) {
    let serviceFilePath = this.getCellServicePath(cellInfo)
    let serviceStarted = await existsFile(serviceFilePath)
    if (serviceStarted) {
      await this.systemctrl('stop', cellInfo)
      await deleteFile(serviceFilePath)
      for (let i = 0; i < this.runningCells.length; i++) {
        if (this.runningCells[i].name === cellInfo.name &&
          this.runningCells[i].version === cellInfo.version) {
          this.runningCells.splice(i, 1)
          i -= 1
        }
      }
      await this.updateStore()
    }
  }
  async updateStore () {
    return writeFile(path.join(process.cwd(), 'running-cells-store.json'),
      JSON.stringify(this.runningCells))
  }
  async listCells () {
    return this.runningCells
  }
  async systemctl (command, cellInfo) {
    let promises = []
    for (let i = 0; i < cellInfo.mitosis.count; i++) {
      promises.push(exec(`systemctl ${command} ${this.getServiceName(cellInfo, i)}`))
    }
    return Promise.all(promises)
  }
  getServiceName (cellInfo, nextNumber) {
    return cellInfo.name + cellInfo.version + '@' + nextNumber
  }
  getCellServicePath (cellInfo) {
    return path.join(this.dna.configsPath, cellInfo.name + '@.service')
  }
}

const writeFile = function (filepath, content) {
  return new Promise((resolve, reject) => {
    if (process.env.DRY) return console.info('[write]', filepath, '...')
    fs.writeFile(filepath, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const existsFile = function (filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, (err) => {
      if (err) return resolve(false)
      resolve(true)
    })
  })
}

const deleteFile = function (filepath) {
  return new Promise((resolve, reject) => {
    if (process.env.DRY) return resolve(console.info('[delete]', filepath, '...'))
    fs.unlink(filepath, (err) => {
      if (err) return reject(err)
      resolve(true)
    })
  })
}

const is_version_legacy = function (versionConditions, existing_version, new_version) {
  let diffValue = semverDiff(existing_version, new_version)
  return versionConditions.indexOf(diffValue) !== -1
}

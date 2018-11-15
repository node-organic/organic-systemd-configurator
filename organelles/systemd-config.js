const fs = require('fs')
const ejs = require('ejs')
const exec = require('../lib/exec')
const path = require('path')

module.exports = class {
  constructor (plasma, dna) {
    this.plasma = plasma
    this.dna = dna
    this.templatePromise = this.loadTemplate()
    this.plasma.on('onCellMitosisComplete', this.onCellMitosisComplete, this)
    this.plasma.on('onCellApoptosisComplete', this.onCellApoptosisComplete, this)
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
  onCellMitosisComplete (c, next) {
    let cellInfo = c.cellInfo
    if (cellInfo.mitosis.zygote) return
    let serviceFilePath = this.getCellServicePath(cellInfo)
    this.templatePromise.then(async (template) => {
      let serviceStarted = await existsFile(serviceFilePath)
      let serviceContent = ejs.render(template, cellInfo)
      await writeFile(serviceFilePath, serviceContent)
      console.info('wrote', serviceFilePath)
      if (!serviceStarted) {
        await this.systemctl('enable', cellInfo)
        await this.systemctl('start', cellInfo)
      } else {
        await this.systemctl('restart', cellInfo)
      }
    })
    next()
  }
  async onCellApoptosisComplete (c, next) {
    let cellInfo = c.cellInfo
    if (cellInfo.mitosis.zygote) return
    let serviceFilePath = this.getCellServicePath(cellInfo)
    let serviceStarted = await existsFile(serviceFilePath)
    if (serviceStarted) {
      console.info('delete', serviceFilePath)
      await this.systemctl('stop', cellInfo)
      await deleteFile(serviceFilePath)
    }
    next()
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
    return path.join(this.dna.configsPath, cellInfo.name + cellInfo.version + '@.service')
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

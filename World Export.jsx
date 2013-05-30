// World Exporter v0.0.1
// Make Photoshop a Level Editor!!
// Author: Ladace

// Helper functions
Array.prototype.map = function (callback) {
	var ret = []
	for (var i = 0; i < this.length; ++i)
		ret.push(callback(this[i]))
	return ret
}

Array.prototype.indexOf = function (value) {
	for (var i = 0; i < this.length; ++i)
		if (this[i] == value) return i
	return -1
}

String.prototype.trimLeft = function() {
	var match = this.match(/\s+/)
	return match ? this.substr(match[0].length) : this
}

function forEach(arr, callback) {
	for (var i = 0; i < arr.length; ++i)
		callback(arr[i])
}

function mainName(name) {
	var p = name.lastIndexOf('.')
	if (p != -1) return name.substr(0, p)
	else return name
}

function componentName(layer) {
	return layer.name.substr(layer.name.indexOf(':') + 1).trimLeft()
}

function iterateLayers(layers, callback) {
	for (var i = 0; i < layers.length; ++i) {
		callback(layers[i])
		if (layers[i].typename == 'LayerSet')
			iterateLayers(layers[i].layers, callback)
	}
}

function undo(doc, n) {
	doc.activeHistoryState = doc.historyStates[doc.historyStates.length - 1 - (n || 1)]
}

function framesIn(layerSet) {
	var res = new Array()
	forEach(layerSet.layers, function (layer) {
		var match = layer.name.match(/^frame(\d+)$/)
		if (match) {
			var m = parseInt(match[1])
			if (res.indexOf(m) == -1) res.push(m)
		}
	})
	return res
}

function isComponent(layer) {
	return layer.name.substr(0, 4) == "cpn:"
}

// preprocess

var doc = app.activeDocument

// read options from config xml file
var config = new File(doc.path + '/' + doc.name + ".conf")
var savPath = doc.path

if (config.exists) {
	config.open('r')
	var xml = new XML(config.read())
		savPathNode = xml.path[0]
	if (savPathNode && savPathNode.@value) savPath = savPathNode.@value
	if (savPath != '' && savPath[0] != '/' && savPath[0] != '~')
		savPath = doc.path + '/' + savPath
}

// pop up a options dialog

var sets = []
// get layers
function findComponents(layers) {
	for (var i = 0; i < layers.length; ++i) {
		if (isComponent(layers[i]))
			sets.push(layers[i])
		if (layers[i].typename == 'LayerSet') {
			findComponents(layers[i].layers)
		}	
	}
}

findComponents(doc.layers)

var optionsDlg = new Window('dialog', 'Options')
optionsDlg.add('statictext', undefined, 'Exporting to "' + savPath + '"')
optionsDlg.pnl = optionsDlg.add('panel', undefined, "Choosing Components to Export:")
optionsDlg.lsb = optionsDlg.pnl.add('listbox', [10, 10, 180, 250], sets.map(componentName))
optionsDlg.selAllBtn = optionsDlg.pnl.add('checkbox', undefined, 'select all')

var items = optionsDlg.lsb.items

for (var i = 0; i < optionsDlg.lsb.items.length; ++i) {
	optionsDlg.lsb.items[i].checked = true
	optionsDlg.lsb.items[i].data = sets[i]
}

optionsDlg.lsb.addEventListener('click', function (e) {
	if (optionsDlg.lsb.selection)
		optionsDlg.lsb.selection.checked = !optionsDlg.lsb.selection.checked;
})

optionsDlg.selAllBtn.value = true
optionsDlg.selAllBtn.onClick = function () {
	for (var i = 0; i < optionsDlg.lsb.items.length; ++i)
	optionsDlg.lsb.items[i].checked = optionsDlg.selAllBtn.value
}


optionsDlg.btnPnl = optionsDlg.add('group')
optionsDlg.btnPnl.orientation = 'row'
optionsDlg.okBtn = optionsDlg.btnPnl.add('button', undefined, 'OK', {name : 'ok'})
optionsDlg.cancelBtn = optionsDlg.btnPnl.add('button', undefined, 'Cancel', {name : 'cancel'})

// start export
if (optionsDlg.show() == 1) {

	var cpns = []
	for (var i = 0; i < optionsDlg.lsb.items.length; ++i) {
		var item = optionsDlg.lsb.items[i]
		if (item.checked) cpns.push(item.data)
	}
	
	var savePrefix = savPath + "/" + mainName(doc.name) + "-"
	var saveOptions = new PNGSaveOptions()
	saveOptions.compression = 0
	saveOptions.interlaced = false
	

	var dlg = new Window('palette', 'Exporting Frames')
	dlg.add('statictext', undefined, 'Exporting to the path: "' + savPath + '"')
	dlg.show()

	var oldVisible = []
	iterateLayers(doc.layers, function (layer) {
		oldVisible.push(layer.visible)
		layer.visible = false
	})
	
	forEach(cpns, function (cpn) {
		var p = cpn.parent
		while (p != doc) {
			p.visible = true
			p = p.parent
		}
	})
	
	forEach(cpns, function (cpn) {
		doc.crop(cpn.bounds)
		cpn.visible = true
		var frames = []
		if (cpn.typename == 'LayerSet') {
			iterateLayers(cpn.layers, function (layer) {
				layer.visible = !isComponent(layer) // TODO set it to oldVisible
			})
			frames = framesIn(cpn)
		}
		if (frames.length === 0) doc.saveAs(new File(savePrefix + componentName(cpn) + ".png"), saveOptions, true, Extension.LOWERCASE)
		else {
			forEach(frames, function (f) {
				forEach(cpn.layers, function (layer) {
					if (layer.name == "frame" + f) layer.visible = true
					else layer.visible = false
				})
				doc.saveAs(new File(savePrefix + componentName(cpn) + "@" + f + ".png"), saveOptions, true, Extension.LOWERCASE)
			})
		}
		undo(doc)
	})
	
	iterateLayers(doc.layers, function (layer) {
		layer.visible = oldVisible.shift()
	})
	

	dlg.close()
	
}
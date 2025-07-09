import {ACIDWrapper} from "../submodules/acid/js/acidWrapper.js"
import {GUIWrapper} from "../submodules/av/js/frontend/GUIWrapper.js"
import {FSWrapper} from "../submodules/av/js/frontend/FSWrapper.js"

const IPC = require("electron").ipcRenderer
const TAP = new Array(8).fill(performance.now(),0,7)

const DEV = process.argv.includes("--dev=true")

window.addEventListener("DOMContentLoaded",function(){
  let FILE

  const input = document.getElementById("input")
  const filename = document.getElementById("filename")

  let FS = new FSWrapper(function(){
    FILE = FS.get()
    init()
    save()
    document.body.classList.remove("preload")
  })

  const actions = {
    toggleui: function(){
      document.body.classList.toggle("ui-hidden")
    },
    // refreshio: function(){
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // changeinput: function(){
    //   IO.nextInput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // previousinput: function(){
    //   IO.prevInput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // nextinput: function(){
    //   IO.nextInput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // changeoutput: function(){
    //   IO.nextOutput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // previousoutput: function(){
    //   IO.prevOutput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    // nextoutput: function(){
    //   IO.nextOutput()
    //   FILE.io = IO.refresh()
    //   save()
    // }.bind(this),
    tempoup: function(){
      FILE.config.clock.tempo = Math.min(600,FILE.config.clock.tempo+1)
      save()
    }.bind(this),
    tempodown: function(){
      FILE.config.clock.tempo =  Math.max(1,FILE.config.clock.tempo-1)
      save()
    }.bind(this),
    taptempo: function(){
      tap()
    }.bind(this),
    toggleclocktype: function(){
      FILE.config.clock.type = !FILE.config.clock.type
      save()
    }.bind(this),
    ppq24: function(){
      FILE.config.clock.type = false
      save()
    }.bind(this),
    ppq48: function(){
      FILE.config.clock.type = true
      save()
    }.bind(this),
    toggleclocksource: function(){
      FILE.config.clock.source = !FILE.config.clock.source
      save()
    }.bind(this),
    toggleclocksend: function(){
      FILE.config.io.clock.send = !FILE.config.io.clock.send
      save()
    }.bind(this),
    toggleclockrecieve: function(){
      FILE.config.io.clock.recieve = !FILE.config.io.clock.recieve
      save()
    }.bind(this),
    toggletransportsend: function(){
      FILE.config.io.transport.send = !FILE.config.io.transport.send
      save()
    }.bind(this),
    toggletransportrecieve: function(){
      FILE.config.io.transport.recieve = !FILE.config.io.transport.recieve
      save()
    }.bind(this),
    playpause: function(){
      FILE.transport.running = !FILE.transport.running
      FILE.transport.stopped = false
      save()
    }.bind(this),
    stop: function(){
      FILE.transport.running = false
      FILE.transport.stopped = true
      save()
    }.bind(this),
    start: function(){
      FILE.transport.running = true
      FILE.transport.stopped = false
      save()
    },
    continue: function(){
      FILE.transport.running = true
      FILE.transport.stopped = false
      save()
    },
    forwards: function(){
      FILE.transport.delay += 50
      save()
    },
    backwards: function(){
      FILE.transport.delay -= 50
      save()
    },
    exportimage: function(){
      ACID.canvas.toBlob((blob) => {
        FS.exportBlob(blob,"png")
      })  
    }.bind(this),
    exportfragmentshader: function(){
      let f = ACID.fragmentShader
      if(f){
        let blob = new Blob([f], {type: 'text/plain'})
        FS.exportBlob(blob,"frag")
      }
    }.bind(this),
    startrecording: function(){
      ACID.EXPORT.recorder.start((chunks) => {
        let blob = new Blob(chunks, {type: "video/webm" })
        FS.exportBlob(blob,"webm")
      })
      document.body.classList.add("recording")
    }.bind(this),
    stoprecording: function(){
      ACID.EXPORT.recorder.stop()
      document.body.classList.remove("recording")
    }.bind(this)
  }

  const displays = {
    fileType: "filetype",
    inputLabel: "io.in.selected.label",
    inputTotal: "io.in.available",
    inputIndex: "io.in.selected.index",
    outputLabel: "io.out.selected.label",
    outputTotal: "io.out.available",
    outputIndex: "io.out.selected.index",
    tempo: "config.clock.tempo",
    clockType: "config.clock.type",
    clockSource: "config.clock.source",
    clockSend: "config.io.clock.send",
    clockRecieve: "config.io.clock.recieve",
    transportSend: "config.io.transport.send",
    transportRecieve: "config.io.transport.recieve",
    transportRunning: "transport.running",
    transportStopped: "transport.stopped"
  }
  
  let GUI = new GUIWrapper(actions,displays)
  let ACID = new ACIDWrapper()

  function save(){
    update()
    FS.save(FILE,function(){
      IPC.send("refresh","index")
    })
  }
  function update(){
    if(input.innerText != FILE.input){
      input.blur()
      input.innerText = FILE.input
    }
    if(filename.innerText != FILE.filename){
      filename.blur()
      filename.innerText = FILE.filename
    }
    let a = ACID.update(FILE)
    FILE.acid.shader = a.shader
    FILE.acid.parameters = a.parameters
    GUI.update(FILE)
  }
  function refresh() {
    FS.update(() => {
      FILE = FS.get()
      save()
    })
  }
  function init(){
    input.innerText = FILE.input
    filename.innerText = FILE.filename
    FILE.transport.delay = 0
    input.addEventListener("input",function(e){
      let text = e.target.innerText
      FILE.input = text
      save()
    })
    input.addEventListener("keydown",function(e){
      if(
        (e.keyCode == 9) ||
        ((e.keyCode == 37 || e.keyCode == 39) && e.shiftKey && e.metaKey) ||
        (e.keyCode == 32 && (e.shiftKey || e.metaKey))
      ){
        e.preventDefault()
      }
    })
    filename.addEventListener("keydown",function(e){
      if(e.keyCode == 9 || e.keyCode == 13 || e.keyCode == 32){
        e.preventDefault()
      }
    })
    filename.addEventListener("blur",function(e){
      let fn = e.target.innerText
      if(fn.length == 0){
        fn = "UNTITLED"
        e.target.innerText = fn
      }
      FILE.filename = fn
      save()
    })
  }
  function tap(){
    TAP.shift()
    TAP.push(performance.now())
    FILE.config.clock.tempo = Math.round(30000 / ((TAP.reduce((a, b) => b - a) / TAP.length)))
    save()
  }

  IPC.on("action", (event,action) => {
    action = action.toLowerCase()
    if(actions[action]){
      actions[action]()
    }
  }) 
  IPC.on("refresh", (event,sender) => {
    refresh()
  }) 
})


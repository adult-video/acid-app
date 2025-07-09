import {GUIWrapper} from "../submodules/av/js/frontend/guiWrapper.js"
import {ACID} from "../submodules/acid/js/acid.js"
import {FSWrapper} from "../submodules/av/js/frontend/fsWrapper.js"

const IPC = require("electron").ipcRenderer

window.addEventListener("DOMContentLoaded",function(){
  let SET_FUNC = null
  let GUI
  let FILE
  let FS = new FSWrapper(function(){
    FILE = FS.get()
    init()
  })

  let actions = {
    increasefontsize: function(){
      let v = FILE.settings.general.fontsize
      v++
      FILE.settings.general.fontsize = Math.min(48,v)
      update()
      save()
    },
    decreasefontsize: function(){
      let v = FILE.settings.general.fontsize
      v--
      FILE.settings.general.fontsize = Math.max(8,v)
      update()
      save()
    },
    togglegeneralaligntextcenter: function(){
      FILE.settings.general.alignTextCenter = !FILE.settings.general.alignTextCenter
      update()
      save()
    },
  	selectsectiongeneral: function(){
  		document.getElementById("settings").classList = "sectionGeneral-active"
  	}.bind(this),
  	selectsectionacid: function(){
  		document.getElementById("settings").classList = "sectionAcid-active"
  	}.bind(this),
    toggleacidignoremappings: function(){
      FILE.settings.acid.properties.ignoreMappings = !FILE.settings.acid.properties.ignoreMappings
      update()
      save()
    }.bind(this),
    toggleacidglobalbitmap: function(){
      FILE.settings.acid.properties.globalBitmap = !FILE.settings.acid.properties.globalBitmap
      update()
      save()
    }.bind(this),
    acidgenerateseed: function(){
      FILE.settings.acid.properties.seed = Math.floor(Math.random() * 1000000)
      update()
      save()
    }.bind(this),
    setcharacter: function(e,targetOverwrite){
      if(SET_FUNC){
        document.removeEventListener("keydown",SET_FUNC)
        update()
      }
      e.target.innerText = "Press any key"
      let char = ACID.LATIN_ALPHABET.indexOf(e.target.getAttribute("data-char"))
      let target = targetOverwrite || "settings.acid.mapping." + char
      SET_FUNC = function(char,target,e){
        if(GUIWrapper.isValidCharacterKeyCode(e.keyCode)){
          let key = e.key.toUpperCase()
          if(
            !(FILE.settings.general.occupiedCharacters.includes(key))
          ){
            let v = GUIWrapper.getValueFromKeystring(target,FILE)
            FILE.settings.general.occupiedCharacters = FILE.settings.general.occupiedCharacters.replace(v,key)
            GUIWrapper.setValueFromKeystring(target,key,FILE)
            document.removeEventListener("keydown",SET_FUNC)
            SET_FUNC = null
            update()
            save()
          }
        }
      }.bind(this,char,target)
      document.addEventListener("keydown",SET_FUNC)
    },
    setacidcommentindicator: function(e){
      actions.setcharacter(e,"settings.acid.properties.commentIndicator")
    }
  }
  let displays = {
    generalFontsize: "settings.general.fontsize",
    generalAlignTextCenter: "settings.general.alignTextCenter",
    acidIgnoreMappings: "settings.acid.properties.ignoreMappings",
    acidGlobalBitmap: "settings.acid.properties.globalBitmap",
    acidSeed: "settings.acid.properties.seed",
    acidCommentIndicator: "settings.acid.properties.commentIndicator"
  }

  function init(){
    for(let i in ACID.LATIN_ALPHABET){
      let c = ACID.LATIN_ALPHABET[i]
      displays["acidMapping" + c] = "settings.acid.mapping." + i
    }
    GUI = new GUIWrapper(actions,displays)
    update()
  }
  
  function update(){
    GUI.update(FILE)
  }

  function save(){
    FS.save(FILE,function(){
      IPC.send("refresh","settings")
    })
  }

  function refresh() {
    FS.update(() => {
      FILE = FS.get()
      update()
    })
  }

  IPC.on("refresh", (event,sender) => {
    refresh()
  })
})


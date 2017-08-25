import './style.scss'

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/theme/neo.css'
import 'codemirror/addon/display/autorefresh'

import InlineCodeCompiler from './../InlineCodeCompiler'

export default class InlineCodeConsole {
  constructor({ root, baseOutput = '// Console', theme = '', height = '300px' }) {
    
    this.baseOutput = baseOutput

    this.compiler = new InlineCodeCompiler({ console: this })

    this.element = document.createElement('section')
    this.element.classList.add('inlineCodeSuite-console')
    this.element.style.height = height

    this.history = []
    this.historyIndex = 0

    this.scriptInScope = ''

    // scaffold elements
    const outputElement = document.createElement('textarea')
    const consoleElement = document.createElement('textarea')
    this.element.appendChild(outputElement)
    this.element.appendChild(consoleElement)

    // build out this.codeConsole
    // NOTE: textarea must be appended before CodeMirror is initalized, otherwise
    // bugs ensue.
    root.appendChild(this.element)

    outputElement.setAttribute('disabled', 'disabled')
    this.consoleOutput = CodeMirror.fromTextArea(outputElement, {
      lineNumbers: false,
      lineWrapping: true,
      autoRefresh: true,
      readOnly: 'nocursor',
      gutters: ['output'],
      mode: 'javascript',
      theme: 'neo output ' + (theme ? theme : '')
    })
    this.consoleOutput.setValue(baseOutput)

    this.codeConsole = CodeMirror.fromTextArea(consoleElement, {
      lineNumbers: false,
      lineWrapping: true,
      autoRefresh: true,
      gutters: ['prompt'],
      mode: 'javascript',
      theme: 'neo input ' + (theme ? theme : ''),
      extraKeys: {
        Enter: (cm) => {
          const input = this.codeConsole.getValue()
          if (input == 'clear') {
            this.clear()
            return
          }
          const compiled = this.compiler.compile({
            code: this.scriptInScope + input + "\n",
            mode: 'console',
            forceReturn: true
          })
          if (!compiled.output) {
            return
          }
          if (compiled.success) {
            this.scriptInScope += input + "\n"
          }
          this.history.unshift( input )
          this.historyIndex = 0
          this.appendOutput(input + "\n" + "// " + compiled.output)
          this.codeConsole.setValue('')
          this.scrollToBottom()
        },
        Up: (cm) => {
          if (!this.history.length) { return false }
          this.codeConsole.setValue( this.history[this.historyIndex] )
          cm.setCursor({line:1, ch: 1})
          this.historyIndex = ++this.historyIndex % this.history.length
        },
        Down: (cm) => {
          if (!this.history.length) { return false }
          this.codeConsole.setValue( this.history[this.historyIndex] )
          cm.setCursor({line:1, ch: 1})
          this.historyIndex = (--this.historyIndex + this.history.length) % this.history.length
        }
      }
    })
    this.codeConsole.setSize('100%', '40px')

    this.registerClickHandler()
  }

  appendOutput(output) {
    if (!output) { return false }
    this.consoleOutput.setValue( this.consoleOutput.getValue() + "\n" + output)
  }

  clear() {
    this.scriptInScope = ''
    this.replaceOutput()
    this.codeConsole.setValue('')
  }

  replaceOutput(output = '') {
    this.consoleOutput.setValue(this.baseOutput + output)
  }

  registerClickHandler() {
    this.element.onclick = e => this.codeConsole.focus()
  }

  scrollToBottom() {
    setTimeout( () => this.element.scrollTop = this.element.scrollHeight, 100)
  }
}


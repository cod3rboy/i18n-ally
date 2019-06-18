import { ExtensionContext, window, commands } from 'vscode'
import { LocalesTreeProvider } from './LocalesTreeView'
import { KeyDetector, LocaleNode, Global } from '../core'
import { ExtensionModule } from '../modules'
import { isSupportedLanguageId } from '../core/SupportedLanguageIds'

export class FileLocalesTreeProvider extends LocalesTreeProvider {
  constructor (
    ctx: ExtensionContext,
  ) {
    super(ctx, [], true)
    this.loadCurrentDocument()
    window.onDidChangeActiveTextEditor(() => this.loadCurrentDocument())
    window.onDidChangeTextEditorSelection(() => this.loadCurrentDocument())
  }

  loadCurrentDocument () {
    const editor = window.activeTextEditor

    if (!editor || !isSupportedLanguageId(editor.document.languageId)) {
      commands.executeCommand('setContext', 'vue-i18n-ally-supported-file', false)
      this.includePaths = []
    }
    else {
      commands.executeCommand('setContext', 'vue-i18n-ally-supported-file', true)
      this.includePaths = KeyDetector.getKeyByContent(editor.document.getText())
    }

    this.refresh()
  }

  getRoots () {
    const roots = super.getRoots()
    const realPaths = roots.map(i => i.node.keypath)
    if (!this.includePaths)
      return roots

    // create shadow nodes
    const shadowPaths = this.includePaths
      .filter(path => !realPaths.includes(path))

    for (const keypath of shadowPaths) {
      let node = Global.loader.getTreeNodeByKey(keypath)
      if (node && node.type === 'tree') {
        roots.push(this.newItem(node))
      }
      else {
        node = new LocaleNode(keypath, '', {}, true)
        roots.push(this.newItem(node))
      }
    }

    return this.sort(roots)
  }
}

const m: ExtensionModule = (ctx) => {
  const treeDataProvider = new FileLocalesTreeProvider(ctx)

  window.createTreeView('locales-tree-file', {
    treeDataProvider,
    // @ts-ignore
    showCollapseAll: true,
  })
  window.createTreeView('locales-tree-file-explorer', {
    treeDataProvider,
    // @ts-ignore
    showCollapseAll: true,
  })

  return []
}

export default m

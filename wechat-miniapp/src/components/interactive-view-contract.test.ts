import fs from 'fs'
import path from 'path'
import * as ts from 'typescript'

import { describe, expect, it } from 'vitest'

const sourceRoot = path.resolve(__dirname, '..')

function collectTsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath)
    }
    if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      return [fullPath]
    }
    return []
  })
}

function getAttributeName(attr: ts.JsxAttributeLike): string | undefined {
  return ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)
    ? attr.name.text
    : undefined
}

function hasAttribute(node: ts.JsxOpeningLikeElement, name: string): boolean {
  return node.attributes.properties.some((attr) => getAttributeName(attr) === name)
}

function getAttribute(node: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
  return node.attributes.properties.find(
    (attr): attr is ts.JsxAttribute => ts.isJsxAttribute(attr) && getAttributeName(attr) === name
  )
}

function getAttributeText(sourceFile: ts.SourceFile, node: ts.JsxOpeningLikeElement, name: string): string {
  return getAttribute(node, name)?.initializer?.getText(sourceFile) ?? ''
}

function formatLocation(sourceFile: ts.SourceFile, node: ts.Node): string {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return `${path.relative(sourceRoot, sourceFile.fileName)}:${location.line + 1}:${location.character + 1}`
}

describe('interactive View contract', () => {
  it('labels every clickable View as a button', () => {
    const offenders: string[] = []

    for (const file of collectTsxFiles(sourceRoot)) {
      const source = fs.readFileSync(file, 'utf8')
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const isView = node.tagName.getText(sourceFile) === 'View'
          const isClickable = hasAttribute(node, 'onClick')
          const hasAccessibleButton = hasAttribute(node, 'ariaRole') && hasAttribute(node, 'ariaLabel')

          if (isView && isClickable && !hasAccessibleButton) {
            offenders.push(formatLocation(sourceFile, node))
          }
        }
        ts.forEachChild(node, visit)
      }

      visit(sourceFile)
    }

    expect(offenders).toEqual([])
  })

  it('uses the shared disabled action handler for disabled action buttons', () => {
    const offenders: string[] = []

    for (const file of collectTsxFiles(sourceRoot)) {
      const source = fs.readFileSync(file, 'utf8')
      const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const isView = node.tagName.getText(sourceFile) === 'View'
          const styleText = getAttributeText(sourceFile, node, 'style')
          const clickText = getAttributeText(sourceFile, node, 'onClick')
          const usesDisabledActionStyle = styleText.includes('getActionButtonStyle') && styleText.includes('disabled:')

          if (isView && usesDisabledActionStyle && !clickText.includes('getEnabledActionHandler(')) {
            offenders.push(formatLocation(sourceFile, node))
          }
        }
        ts.forEachChild(node, visit)
      }

      visit(sourceFile)
    }

    expect(offenders).toEqual([])
  })

  it('keeps touch targets at 44px or larger', () => {
    const offenders = collectTsxFiles(sourceRoot)
      .filter((file) => fs.readFileSync(file, 'utf8').includes("minHeight: '36px'"))
      .map((file) => path.relative(sourceRoot, file))

    expect(offenders).toEqual([])
  })
})

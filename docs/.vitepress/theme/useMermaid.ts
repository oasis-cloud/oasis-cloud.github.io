export async function renderMermaid(root: ParentNode = document) {
  const nodes = [
    ...root.querySelectorAll<HTMLElement>('.mermaid:not([data-processed])'),
  ]
  if (!nodes.length) return

  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: 'Crimson Text, Georgia, serif',
    themeVariables: {
      background: '#ffffff',
      primaryColor: '#ffffff',
      primaryTextColor: '#000000',
      primaryBorderColor: '#000000',
      lineColor: '#000000',
      secondaryColor: '#ffffff',
      tertiaryColor: '#ffffff',
      fontFamily: 'Crimson Text, Georgia, serif',
    },
  })

  await mermaid.run({ nodes })
}

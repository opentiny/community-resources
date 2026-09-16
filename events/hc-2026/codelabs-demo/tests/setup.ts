if (typeof document !== 'undefined') {
  if (!document.body) {
    const body = document.createElement('body')
    document.documentElement.appendChild(body)
  }

  if (document.getElementsByTagName('script').length === 0) {
    const script = document.createElement('script')
    script.setAttribute('data-injectcss', '')
    document.head.appendChild(script)
  }
}

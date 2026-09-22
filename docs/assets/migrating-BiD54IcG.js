import{H as e,et as t}from"./web-CX4CTzKu.js";import{l as n}from"./virtual_solid-ssr-entry-client-Bpzgn6ZA.js";import{t as r}from"./components-BNUblAyO.js";var i=void 0;function a(t){let i={code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,span:`span`,...r(),...t.components};return[e(n,{children:`Migrating from v1 - solid-validation`}),`
`,e(i.h1,{children:`Migrating from v1`}),`
`,e(i.p,{get children(){return[`v2 targets Solid 2. Two things drive every change below: Solid 2 removed `,e(i.code,{children:`use:`}),`
directives, and it batches store writes.`]}}),`
`,e(i.h2,{children:`Directives become ref factories`}),`
`,e(i.p,{get children(){return[e(i.code,{children:`use:validate`}),` and `,e(i.code,{children:`use:formSubmit`}),` are gone, because Solid 2 has no directives.
Each is now a function you call, which returns a ref callback.`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-<form use:formSubmit={onSubmit}>`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-  <input name='email' required use:validate />`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-  <input name='handle' use:validate={[minLength(3)]} />`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-</form>`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+<form ref={formSubmit(onSubmit)}>`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+  <input name='email' required ref={validate()} />`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+  <input name='handle' ref={validate(() => [minLength(3)])} />`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+</form>`})}})]}})}}),`
`,e(i.p,{get children(){return[`Destructuring `,e(i.code,{children:`useForm()`}),` is no longer required. The directive compiler needed
the names in scope; a ref factory is an ordinary value, so `,e(i.code,{children:`form.validate(...)`}),`
works as well.`]}}),`
`,e(i.h2,{children:`validators take an accessor`}),`
`,e(i.p,{get children(){return[e(i.code,{children:`validate`}),` takes a function returning the array, not the array itself. The
directive compiler used to insert that wrapper for you.`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-use:validate={[minLength(3), noSpaces]}`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+ref={validate(() => [minLength(3), noSpaces])}`})}})]}})}}),`
`,e(i.p,{children:`The wrapper is what makes a conditional rule work, because the array is read
when the field is checked rather than when it mounts:`}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`<`}),e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`input`}),e(i.span,{style:{"--shiki-light":`#0550AE`,"--shiki-dark":`#79C0FF`},children:` ref`}),e(i.span,{style:{"--shiki-light":`#CF222E`,"--shiki-dark":`#FF7B72`},children:`={`}),e(i.span,{style:{"--shiki-light":`#8250DF`,"--shiki-dark":`#D2A8FF`},children:`validate`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`(() `}),e(i.span,{style:{"--shiki-light":`#CF222E`,"--shiki-dark":`#FF7B72`},children:`=>`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:` [isRequired, `}),e(i.span,{style:{"--shiki-light":`#8250DF`,"--shiki-dark":`#D2A8FF`},children:`needsMatch`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`() `}),e(i.span,{style:{"--shiki-light":`#CF222E`,"--shiki-dark":`#FF7B72`},children:`&&`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:` mustMatch])`}),e(i.span,{style:{"--shiki-light":`#CF222E`,"--shiki-dark":`#FF7B72`},children:`}`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:` />`})]}})}})}}),`
`,e(i.p,{get children(){return[e(i.code,{children:`formSubmit`}),` takes the callback directly. Your callback closes over its own
signals and reads them when it runs, so there is nothing to defer.`]}}),`
`,e(i.h2,{children:`validateRef is gone`}),`
`,e(i.p,{get children(){return[`It existed because directives could not cross a component boundary. Ref
factories can, so `,e(i.code,{children:`validate`}),` covers both cases and `,e(i.code,{children:`validateRef`}),` is removed.`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-<input ref={props.validateRef(minLength(3), noSpaces)} />`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+<input ref={props.validate(() => [minLength(3), noSpaces])} />`})}})]}})}}),`
`,e(i.p,{children:`Note the arguments become one array inside an accessor.`}),`
`,e(i.h2,{children:`Errors arrive a tick later`}),`
`,e(i.p,{get children(){return[`Solid 2 batches store writes. In v1 a blur on an empty required field put the
message in `,e(i.code,{children:`errors`}),` in the same tick as the event. It now lands on the next
flush.`]}}),`
`,e(i.p,{get children(){return[`Nothing changes for rendering, since anything reading `,e(i.code,{children:`errors.email`}),` in JSX
updates when the write settles. It matters if you read the store imperatively
straight after an event:`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`field.`}),e(i.span,{style:{"--shiki-light":`#8250DF`,"--shiki-dark":`#D2A8FF`},children:`dispatchEvent`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`(`}),e(i.span,{style:{"--shiki-light":`#CF222E`,"--shiki-dark":`#FF7B72`},children:`new`}),e(i.span,{style:{"--shiki-light":`#8250DF`,"--shiki-dark":`#D2A8FF`},children:` FocusEvent`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`(`}),e(i.span,{style:{"--shiki-light":`#0A3069`,"--shiki-dark":`#A5D6FF`},children:`'blur'`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`));`})]}}),`
`,e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`errors.email; `}),e(i.span,{style:{"--shiki-light":`#6E7781`,"--shiki-dark":`#8B949E`},children:`// still undefined here`})]}})]}})}}),`
`,e(i.p,{get children(){return[e(i.code,{children:`validateField`}),` is unaffected. It awaits its own check and reports the result
directly rather than reading the store back.`]}}),`
`,e(i.p,{get children(){return[`In tests, assert with `,e(i.code,{children:`waitFor`}),` rather than immediately after the action.`]}}),`
`,e(i.h2,{children:`Cleared fields leave no key`}),`
`,e(i.p,{get children(){return[`Clearing an error now deletes its key instead of setting it to `,e(i.code,{children:`undefined`}),`, so
`,e(i.code,{children:`Object.keys(errors)`}),` lists only fields that are currently failing. Code that
counts errors or iterates the store sees the difference; code that reads
`,e(i.code,{children:`errors.email`}),` does not.`]}}),`
`,e(i.h2,{children:`Peer dependencies`}),`
`,e(i.p,{get children(){return[e(i.code,{children:`@solidjs/web`}),` joins `,e(i.code,{children:`solid-js`}),` as a peer, since Solid 2 puts the JSX runtime in
a separate package.`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#0A3069`,"--shiki-dark":`#A5D6FF`},children:`"peerDependencies"`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`: {`})]}}),`
`,e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`  "solid-js"`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`: `}),e(i.span,{style:{"--shiki-light":`#0A3069`,"--shiki-dark":`#A5D6FF`},children:`"^2.0.0"`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`,`})]}}),`
`,e(i.span,{class:`line`,get children(){return[e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`  "@solidjs/web"`}),e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`: `}),e(i.span,{style:{"--shiki-light":`#0A3069`,"--shiki-dark":`#A5D6FF`},children:`"^2.0.0"`})]}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#1F2328`,"--shiki-dark":`#E6EDF3`},children:`}`})}})]}})}}),`
`,e(i.h2,{children:`submit reports its outcome`}),`
`,e(i.p,{get children(){return[e(i.code,{children:`submit()`}),` returned `,e(i.code,{children:`void`}),` in v1, so a caller could not tell whether the
callback ran. It now resolves to a boolean: `,e(i.code,{children:`true`}),` when the submission went
through, `,e(i.code,{children:`false`}),` when validation refused or the callback returned errors.`]}}),`
`,e(i.pre,{class:`shiki shiki-themes github-light-default github-dark-default`,style:{"--shiki-light":`#1f2328`,"--shiki-dark":`#e6edf3`,"--shiki-light-bg":`#ffffff`,"--shiki-dark-bg":`#0d1117`},tabindex:`0`,get children(){return e(i.code,{get children(){return[e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#82071E`,"--shiki-dark":`#FFA198`},children:`-await submit(save);`})}}),`
`,e(i.span,{class:`line`,get children(){return e(i.span,{style:{"--shiki-light":`#116329`,"--shiki-dark":`#7EE787`},children:`+if (await submit(save)) navigate('/done');`})}})]}})}}),`
`,e(i.p,{get children(){return[e(i.code,{children:`formSubmit`}),` is unaffected, since the form element has nowhere to report to.`]}})]}function o(n={}){let{wrapper:i}={...r(),...n.components};return i?e(i,t(n,{get children(){return e(a,n)}})):a(n)}export{o as default,i as frontmatter};
title: Testando Accordions que contenham elementos clicáveis
date: 2026-10-07
description: Esta receita explica como testar elementos interativos posicionados dentro de um Accordion do Tangram, contornando o erro de pointer-events que surge ao clicar em Switches e outros controles.
keywords: testes, tangram, accordion, switch, pointer-events, user-event

---

O componente `<Accordion />` do Tangram é um container expansível bastante usado em telas de configuração e formulários. Além de seu título, responsável pela sua expansão e recolhimento, seu conteúdo interno pode exibir elementos interativos como Botões, Switches, InlineEdits, entre outros.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/accordion.mp4" type="video/mp4" />
  </video>  
</p>

É justamente no caso de algum elemento clicável ser inserido dentro de um Accordion que você pode enfrentar um problema nos testes automatizados. Considere o caso da animação acima onde alguns Switches são exibidos dentro de um Accordion.

Quando teste tenta clicar em um dos Switches, o *userEvent* se recusa a interagir com o elemento porque ele herda `pointer-events: none` enquanto o Accordion ainda está na animação de abertura:

```
Unable to perform pointer interaction as the element inherits `pointer-events: none`
```

Uma possível solução é configurar um *userEvent* específico para o teste com `userEvent.setup({ pointerEventsCheck: 0 })`. Isso desliga a verificação de *pointer-events* feita pela biblioteca e permite clicar no Switch (ou em qualquer outro elemento interativo dentro do Accordion) sem precisar alterar o componente em si:

``` javascript
it('should toggle a switch inside an accordion', async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })
  await mount()
  const { SettingsAccordion } = translation
  await user.click(
    screen.getByRole('button', { name: SettingsAccordion.Settings }),
  )
  await user.click(
    screen.getByRole('checkbox', { name: SettingsAccordion.Updates }),
  )
  // certifica que algo aconteceu
})
```

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/main/packages/main/src/views/SettingsAccordion/SettingsAccordion.test.js).

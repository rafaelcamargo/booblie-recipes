title: Interagindo com tooltips nos testes
date: 2026-10-14
description: Essa receita mostra como garantir a exibição de um Tooltip do Tangram nos testes quando o texto do tooltip coincide com o do botão que o dispara, evitando a armadilha do getByText.
keywords: testes, tangram, tooltip, testing-library, hover, getByRole

---

Para situações nas quais o texto do `<Tooltip />` é igual ao texto presente no elemento no qual ele é aplicado, escrever um teste que garante a correta exibição do tooltip pode ficar um pouquinho mais complicado se você se restringir ao uso de `getByText`.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/edit-tooltip.mp4" type="video/mp4" />
  </video>  
</p>

Imagine um botão cujo texto é *Editar*, embrulhado por um `<Tooltip />` do Tangram cujo texto é também *Editar*:

``` jsx
const Component = () => {
  const { t } = useTranslation()

  return (
    <Tooltip text={t('Component.Edit')}>
      <Button
        startIcon={
          <Pen title={t('Component.PenIcon')} role="presentation" />
        }
      >
        {t('Component.Edit')}
      </Button>
    </Tooltip>
  )
}
```

A estratégia mais comumente usada nesse tipo de teste é fazer *hover* no botão com `userEvent.hover` e, em seguida, buscar o texto do tooltip com um simples `getByText`:

``` javascript
await userEvent.hover(
  screen.getByRole('button', { name: new RegExp(Component.Edit) }),
)
expect(screen.getByText(Component.Edit)).toBeVisible()
```

O problema é que o texto do botão é igual ao texto do tooltip. Com isso, o DOM acaba contendo mais de um nó com o texto *Editar*, e o `getByText` quebra:

```
TestingLibraryElementError: Found multiple elements with the text: Editar
```

Uma primeira solução seria trocar o `getByText` por `getAllByText` e pegar o elemento na posição desejada — por exemplo, `getAllByText(Component.Edit)[1]` para alcançar o `<span>` do tooltip. Essa abordagem, porém, peca pela falta de clareza e legibilidade: um índice mágico pouco diz ao leitor do teste em *qual* dos textos *Editar* você de fato está interessado.

Uma solução mais elegante é aproveitar que o `<Tooltip />` do Tangram renderiza o conteúdo flutuante com `role="tooltip"`. Antes do *hover*, você pode garantir que o tooltip ainda não está no documento; depois do *hover*, basta buscá-lo pelo seu *role* e *name*:

``` javascript
expect(
  screen.queryByRole('tooltip', { name: Component.Edit }),
).not.toBeInTheDocument()
await userEvent.hover(
  screen.getByRole('button', { name: new RegExp(Component.Edit) }),
)
expect(
  screen.getByRole('tooltip', { name: Component.Edit }),
).toBeInTheDocument()
```

Dessa forma, o teste fica altamente legível e fácil de compreender, evitando esforços adicionais de quem precisar entendê-lo ou alterá-lo no futuro.

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/4871cee776c3f3c73537652eb5932dfec4af5a50/packages/main/src/views/EditTooltip/EditTooltip.test.js).

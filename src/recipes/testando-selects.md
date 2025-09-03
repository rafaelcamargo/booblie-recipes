title: Interagindo com o componente Select
date: 2025-09-03
description: Diferentemente de um select nativo, a interação com um componente Select do Tangram exige atenção peculiar a alguns pontos. Este artigo detalha a maneira mais breve, direta e clara de se fazer isso.
keywords: testes, tangram, select, role, button

---

Por não ser um *select* nativo, a interação com o componente `<Select />` do Trangram em um teste automatizado pode ser um pouco desafiadora.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/color-select.mp4" type="video/mp4" />
  </video>  
</p>

## Tentativa 1 (getByRole)

Quem está familiarizado com a bilbioteca *Testing Library*, está acostumado a escrever uma interação bem simples para selecionar uma das opções exibidas por um select:
``` javascript
await userEvent.selectOptions(
  screen.getByRole('combobox', { name: 'Cor' }),
  'Azul'
)
```

Porém, ao tentar usar essa estratégia em um `<Select />` do Tangram, você vai se deparar com o seguinte erro:
```
TestingLibraryElementError: Unable to find an accessible element with the role "combobox" and name "Cor"
```

Isso ocorre porque o `</Select>` do Tangram não é exatamente um *select*, mas sim um *button*.

## Tentativa 2 (getByLabelText)

Tendo descoberto essa diferença de *role*, você poderia tentar uma outra estratégia no teste: obter o `<Select />` pelo seu *label* ao invés de seu *role*:
``` javascript
await userEvent.selectOptions(
  screen.getByLabelText('Cor'),
  'Azul'
)
```

Ao usar esta segunda estratégia, você vai se deparar com o seguinte erro:
```
TestingLibraryElementError: Found a label with the text of: Cor, however the element associated with this label (<div />) is non-labellable [https://html.spec.whatwg.org/multipage/forms.html#category-label]. If you really need to label a <div />, you can use aria-label or aria-labelledby instead.
```

Isso ocorre porque o `<Form.Label />` não se comunica corretamente com o elemento que recebe o `id` informado em seu atributo `htmlFor` — no nosso caso, o `<Select />`.

## Solução

Diante de todas estas peculiaridades e ainda que pareça contra-intuitivo, a maneira mais eficiente de interagir com um `<Select />` do Tangram nos testes automatizados é usando o *role* que de fato lhe foi atribuído: *button*:
``` javascript
// 1. Clique no select como se ele fosse um botão usando
// o texto de algum valor já selecionado ou do placeholder
await userEvent.click(
  screen.getByRole('button', {
    name: new RegExp('Selecione uma cor'),
  }),
)

// 2. Clique em uma das opções pelo role
await userEvent.click(
  screen.getByRole('option', {
    name: 'Azul',
  }),
)

// 3. Podemos confirmar que a opção foi de fato
// escolhida verificando o novo texto associado
// ao botão que representa o <Select />
expect(
  screen.getByRole('button', {
    name: new RegExp('Azul'),
  }),
).toBeInTheDocument()
// Atenção: Esse último assert provavelmente não precisará
// ser feito em seu teste, já que o valor do <Select/ >
// acabará sendo garantido no assert que verifica os
// dados enviado pelo formulário em questão.
```

**Dica**: Na vida real, uma tela costuma ter muito mais elementos que apenas um `<Select />`, portanto, afim de evitar uam eventual colisão com os demais elementos, pode ser útil restringir a query ao `<Form.Control />` ao qual o `<Select />` pertence, usando a função utilitária `within`:
``` javascript
const colorSelectFormControl = container.querySelector(
  '#colorSelectFormControl',
)
await userEvent.click(
  within(colorSelectFormControl).getByRole('button', {
    name: new RegExp('Selecione uma cor'),
  }),
)
```

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/bee1685cd4d3bd8c0188f7049852e5cb798a7df8/packages/main/src/views/ColorSelect/ColorSelect.test.js).

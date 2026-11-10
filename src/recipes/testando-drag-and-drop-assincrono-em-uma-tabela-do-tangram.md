title: Testando Drag and Drop assíncrono em uma tabela do Tangram
date: 2026-11-10
description: Esta receita mostra como testar a integração de uma tabela do Tangram com drag and drop usando o suporte a teclado da biblioteca hello-pangea, validando tanto a requisição quanto a ordem final das linhas.
keywords: testes, drag and drop, tabela, tangram, hello-pangea, teclado, integração

---

Tabelas estão por toda parte nas aplicações da RD Station. Elas organizam listas, comparam informações e, em muitos casos, vêm acompanhadas da necessidade de suportar *drag and drop* para que o usuário possa reordenar os itens exibidos.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/drag-and-drop-table.mp4" type="video/mp4" />
  </video>  
</p>

## O desafio

Implementar *drag and drop* não é trivial: o processo envolve efeitos visuais durante o arraste, reordenamento dos dados em memória e uma requisição para que o backend persista a nova ordem. Nos testes, a complexidade não é menor, já que simular o arraste usando eventos do mouse pode não ser suportado pela biblioteca de testes.

Por isso, é tentador extrair cada parte do processo para um módulo separado e testar cada um deles unitariamente: a função que reordena o array, o efeito visual, a chamada da requisição. O problema é que, seguindo esse caminho, a aplicação pode terminar sem **nenhum teste que garanta que a tabela integrou todas as partes corretamente**. É justamente sobre isso que trata esta receita.

## A solução

Dos pontos que tornam o teste do *drag and drop* difícil, o mais notável é certamente a dificuldade de simular o arraste nos testes.

A boa notícia é que o [@hello-pangea/dnd](https://www.npmjs.com/package/@hello-pangea/dnd), biblioteca usada por esta receita para implementar *drag and drop*, oferece suporte a essa interação via teclado. Ou seja, **é possível disparar o drag and drop nos testes a partir do teclado, sem recorrer aos eventos do mouse**.

## Detalhando a solução

Dado esse suporte, a ideia é criar uma função utilitária na suíte de teste do componente que funcione como uma abstração fina do uso do teclado, potencializando a legibilidade e o fácil entendimento do teste:

``` javascript
function dragAndDropWithKeyboard(element, pressedKeys) {
  element.focus()
  pressedKeys.forEach(key => {
    fireEvent.keyDown(element, { keyCode: getKeyCodeByKeyName(key) })
  })
}

function getKeyCodeByKeyName(keyName) {
  return {
    spacebar: 32,
    arrowDown: 40,
    esc: 27,
  }[keyName]
}
```

A função recebe o elemento que inicia o arraste — no caso da tabela, a alça (*drag handle*) da linha — e uma lista de teclas a serem pressionadas. O `spacebar` inicia e conclui o arraste, o `arrowDown` move a linha para baixo e o `esc` cancela o arraste. Internamente, `fireEvent.keyDown` dispara justamente os `keyCode`s que a biblioteca escuta.

## Interagindo com a tabela

Com a função utilitária em mãos, basta interagir com o componente da tabela e conferir o resultado. O teste abaixo arrasta a segunda linha para baixo, solta e certifica que tanto a requisição quanto o posicionamento final das linhas estão corretos:

``` javascript
describe('Car Table', () => {
  async function mount() {
    return await customRender(
      <QueryProvider>
        <CarTable />
      </QueryProvider>,
      { translation },
    )
  }

  function getTableBodyRows(container) {
    return [...container.querySelectorAll('tbody > tr')]
  }

  function getRowDragHandle(container, rowIndex) {
    const row = getTableBodyRows(container)[rowIndex]
    return within(row).getByRole('button', {
      name: translation.CarTable.DragRow,
    })
  }

  it('should reorder the cars when dragging and dropping a row', async () => {
    const { container } = await mount()
    const { CarTable } = translation
    await waitFor(() => {
      expect(
        screen.getByRole('table', { name: CarTable.Title }),
      ).toBeInTheDocument()
    })
    const [, secondCar, thirdCar] = carsMock
    dragAndDropWithKeyboard(getRowDragHandle(container, 1), [
      'spacebar',
      'arrowDown',
      'spacebar',
    ])
    expect(carsResource.updateOrder).toHaveBeenCalledWith(
      secondCar.id,
      thirdCar.order,
    )
    await waitFor(() => {
      expect(
        within(getTableBodyRows(container)[1]).getByText(thirdCar.name),
      ).toBeInTheDocument()
    })
    expect(
      within(getTableBodyRows(container)[2]).getByText(secondCar.name),
    ).toBeInTheDocument()
    expect(carsResource.get).toHaveBeenCalledTimes(2)
  })
})
```

Note que a verificação da requisição acontece logo após soltar a linha, pois o componente chama `updateOrder` assim que o arraste termina. Já o `waitFor` espera a tabela refletir a nova ordem depois que a requisição resolve e os dados são buscados novamente — por isso a garantia de que `carsResource.get` foi chamado duas vezes. É aí que este teste mostra seu valor: ele cobre o caminho completo, do teclado até a requisição e de volta para a tela.

## Depois do teste de integração

Uma vez que a suíte do componente que tem o domínio da tabela tenha um teste que garanta a integração do código referente ao *drag and drop*, os demais casos de uso podem até ser feitos de modo unitário quando essa estratégia se demonstrar apropriada. Afinal, a garantia de que o todo está realmente funcionando já foi alcançada.

Você pode conferir a implementação completa desta suíte de teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/f90af4d2bd7643349b060b1ad3d82d761a85b668/packages/main/src/views/CarTable/CarTable.test.js).

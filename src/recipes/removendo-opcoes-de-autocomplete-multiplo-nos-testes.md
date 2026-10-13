title: Removendo opções de um Autocomplete múltiplo nos testes
date: 2026-10-13
description: Essa receita aborda uma peculiaridade das tags exibidas no Autocomplete do Tangram que dificulta suas remoções através de testes automatizados.
keywords: testes, tangram, autocomplete, multiple, testing-library, remove tag

---

Uma das atividades mais comuns no desenvolvimento de formulários é a escrita de testes automatizados que verificam múltiplos valores inseridos em um `<Autocomplete />` do Tangram. Porém, ao tentar remover uma tag de um *autocomplete* múltiplo via teste automatizado, você pode acabar se deparando com uma dificuldade em clicar no botão que remove do *autocomplete* uma das tags selecionadas.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/autocomplete-tag-removal.mp4" type="video/mp4" />
  </video>  
</p>

O caminho natural para executar o clique sobre o botão *Remove tag* seria, em primeiro lugar, escopar a busca pelo *id* do `FormControl` no qual as tags estão contidas. Em seguida, buscar todos os botões com nome *Remove tag* usando `getAllByRole` e, por fim, clicar no botão que casa com a posição da tag a ser excluída (por exemplo, a posição `0` exclui a primeira tag, a posição `1` exclui a segunda, e assim por diante). Veja a seguir como ficaria esse trecho:

``` javascript
const userAutocompleteFormControl = container.querySelector(
  '#userAutocompleteFormControl',
)
// Remove a primeira tag
await userEvent.click(
  within(userAutocompleteFormControl).getAllByRole('button', {
    name: 'Remove tag',
  })[0],
)
```

Ao rodar o teste, porém, um erro a seguir é lançado no terminal:

```
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Remove tag".
```

Isso é consequência de uma peculiaridade no funcionamento das tags do *autocomplete*. Embora as tags estejam visíveis no documento, por algum motivo desconhecido cada uma delas embrulha seu conteúdo em um elemento marcado como `aria-hidden="true"` e isso faz com que o teste falhe.

A possível solução é incluir nas opções do `getAllByRole` o atributo `hidden: true`:

``` diff
 await userEvent.click(
   within(userAutocompleteFormControl).getAllByRole('button', {
     name: 'Remove tag',
+    hidden: true,
   })[0],
 )
```

Dessa forma, o teste deixa de ignorar o conteúdo da tag e consegue enfim clicar no botão *Remove tag*.

Mas atenção! Passar `hidden: true` para os métodos `getByRole`/`getAllByRole` não é uma boa prática, uma vez que eles de fato devem ignorar elementos que estão ocultos. Isso só deve ser feito em situações excepcionais como a compartilhada pela atual receita.

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/637682aa5a9ab513fff8c70ea3dc010055fa78b9/packages/main/src/views/UserAutocomplete/UserAutocomplete.test.js).

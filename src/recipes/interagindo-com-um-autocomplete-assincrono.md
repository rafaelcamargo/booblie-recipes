title: Interagindo com um Autocomplete assíncrono
date: 2025-09-25
description: O autcomplete é vastamente utilizado em nossas aplicações. Porém, ao interagir com este componente nos testes é preciso estar atento a algumas de suas peculiaridades. Este artigo detalha como fazer o mock dos dados a ser apresentado pelo autocomplete, bem como selecionar e limpar opções.
keywords: autocomplete, testes, mock, filtro, assíncrono, Tangram

---

O `<Autocomplete />` do Tangram é altamente versátil e cai como uma luva para várias situações dentro das nossas aplicações, fazendo com que a probabilidade de você precisar implementar uma tela que o utilize seja razoavelmente grande. Portanto, esta receita aborda algumas peculiaridades que surgirão à sua frente ao precisar interagir com um *autocomplete* assíncrono em seus testes.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/user-autocomplete.mp4" type="video/mp4" />
  </video>  
</p>

## Fazendo o mock dos dados

Para evitar que o backend precise lidar com respostas muito pesadas, é desejável limitar a quantidade de registros listados em um *autocomplete*. Além do filtro de limite, é muito provável que você tenha que implementar também o filtro por termo de busca.

Dessa forma, é imprescindível que você manipule o mock dos dados levando em considerações os filtros informados para que o comportamento percebido no teste seja o mais próximo possível do comportamento de produção. Veja a seguir como seria feito o mock dos dados utilizados por um autocomplete de usuário:

``` javascript
beforeEach(() => {
  usersResource.get = jest.fn(params => {
    // usersMock é um JSON contendo todos os registros
    const data = usersMock
      // A construção dos dados começa com uma cópia do usersMock
      // que contenha apenas os registros que casam com o termo de busca (name)
      .filter(user => user.name.toLowerCase().includes(params?.name?.toLowerCase() || ''))
      // Por fim, o resultado do filtro é fatiado de acordo com o limite informado
      .slice(0, params.limit)
    return Promise.resolve({ data })
  })
})
```

## Selecionando opções

Nessa interação, o teste vai selecionar duas opções listadas pelo *autocomplete*. Para tal, o input do autocomplete será buscado pelo label que foi dado a ele, as primeiras letras do nome do usuário que queremos selecionar serão digitadas e, por fim, a opção que representa o usuário será selecionada. Em seguida, o *autocomplete* será fechado, as opções serão novamente abertas, e o primeiro usuário da lista será selecionado:

``` javascript
await userEvent.type(screen.getByLabelText('Usuários'), 'Zac')
const firstUserOption = await screen.findByRole('option', {
  name: new RegExp('Zacarias'),
})
await userEvent.click(firstUserOption)
// Ao clicar no body, as opções do autocomplete são fechadas
await userEvent.click(document.body)
await userEvent.click(screen.getByRole('button', { name: /open autocomplete options/i }))
const secondUserOption = await screen.findByRole('option', {
  name: new RegExp('Abigail'),
})
await userEvent.click(secondUserOption)
```

Ao rodar o teste, você vai se deparar com um par de problemas:

### Informações faltantes no evento change

Se você tentar atualizar o estado dos dados do seu formulário ouvindo o atributo `onChange` do *autocomplete* da maneira convencional, perceberá que o evento emitido pelo componente não contém todos os dados esperados, como por exemplo o atributo `name` do `target`:

``` javascript
const handleFormDataChange = ({ target: { name, value } }) => {
  // name será undefined
  setFormData(prevState => ({ ...prevState, [name]: value }))
}

return (
  <Autocomplete
    name="users"
    value={formData.users}
    onChange={handleFormDataChange}
  />
)
```

#### Solução

Conforme detalhado na [documentação](https://tangram.rdstation.com.br/docs/components/autocomplete/) do componente, o `value` é também passado como segundo argumento para o listener, jeito pelo qual a documentação orienta usar o componente:

``` javascript
const handleFormDataChange = (_, newValue) => {}
```

Note porém, que apenas o value é passado, o que vai te obrigar a criar uma função que trate especificamente a mudança do *autocomplete*:
``` javascript
const handleUsersChange = (_, newValue) => {
  setFormData(prevState => ({
    ...prevState,
    users: newValue,
  }))
}
```

### Botão que abre as opções não aceita traduções

Conforme exibido nas linhas de teste acima, foi usado um nome em inglês para se obter o botão que abre as opções do *autocomplete*. Também de acordo com a documentação, o autocomplete não disponibiliza nenhuma propriedade que permita personalizar o nome daquele botão.

#### Solução

Você vai precisar usar o texto estático em inglês sempre que precisar abrir as opções do *autocomplete*:
``` javascript
const userAutocompleteFormControl = container.querySelector(
  '#userAutocompleteFormControl',
)
await userEvent.click(
  within(userAutocompleteFormControl).getByRole('button', {
    name: /open autocomplete options/i,
  }),
)
```

Como pode acabar existindo mais de um autocomplete na tela que você está testando, é aconselhável que você limite a varredura ao form control do autocomplete com o qual você quer de fato interagir. Do contrário, o teste pode acabar clicando no botão correto, mas no *autocomplete* errado.

### Lista de opções filtrada por termo já removido

Depois de criar uma função para tratar especificamente as mudanças do *autocomplete* e conseguir interagir com o botão que abre suas opções, o próximo erro que você receberá ao rodar o teste será:
```
Unable to find role="option" and name `/Abigail/`
```
Isso acontece, porque ao escolher uma opção, o autocomplete apesar de remover o termo digitado em seu *input*, não dispara o listener `onInputChange` passando uma *string* vazia como valor do filtro. Dessa forma, quando voltamos a abrir as opções do *autocomplete* depois da primeira seleção, a lista fica presa nas opções filtradas pelo termo de busca digitado anteriormente, não exibindo a opção Abigail.

#### Solução

Para evitar esse problema, você precisará limpar o termo de busca sempre que uma opção for selecionada:
``` diff
const handleUsersChange = (_, newValue) => {
  setFormData(prevState => ({
    ...prevState,
    users: newValue,
  }))
+ setUsersFetchParams(prevState => ({ ...prevState, name: '' }))
}
```

## Limpando opções

Conforme exibido nas linhas de teste acima, foi usado um nome em inglês para se obter o botão que abre as opções do *autocomplete*. Também de acordo com a documentação, o autocomplete não disponibiliza nenhuma propriedade que permita personalizar o nome daquele botão.

Da mesma maneira que o botão que abre as opções, o botão que limpa o autocomplete (remove as opções selecionadas) também não permite a personalização de seu nome, exibindo um nome estático em inglês.

#### Solução

Você vai precisar usar o texto estático em inglês sempre que precisar clicar no botão que limpa o *autocomplete*:
``` javascript
const userAutocompleteFormControl = container.querySelector(
  '#userAutocompleteFormControl',
)
await userEvent.click(
  within(userAutocompleteFormControl).getByRole('button', {
    name: /clear autocomplete value/i,
  }),
)
```

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/50e5b610f9ab140d5c4ea8390c83ede766466a31/packages/main/src/views/UserAutocomplete/UserAutocomplete.test.js).

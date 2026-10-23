title: Definindo um dublê para preservar a performance de testes que usam Phone do Tangram
date: 2026-10-23
description: Esta receita mostra como usar um test double para evitar que o componente Phone do Tangram degrade a performance de suites de teste, sem abrir mão de garantir o funcionamento do componente original.
keywords: testes, tangram, phone, test double, mock, performance, jest

---

Embora pareça um simples campo de texto, o `<Phone />` do Tangram é um componente relativamente pesado. Por baixo dos panos, ele exibe um *select* de país que adiciona ao documento mais de duzentas opções, o que resulta em mais de 600 elementos adicionais no DOM, mesmo que o *select* nunca seja aberto.

No uso cotidiano da aplicação no navegador, um usuário pode não experimentar qualquer problema de performance. Porém, em testes executados com *Testing Library* e *Jest*, a performance de uma suite pode degradar consideravelmente quando o componente testado faz uso do `<Phone />` do Tangram, podendo demorar até 10 vezes mais por conta dele.

## Solução

Uma das alternativas para desviar deste problema é recorrer a um *test double*. Um *test double* é qualquer objeto ou componente que substitui, durante a execução de um teste, uma dependência real do código testado, imitando o comportamento dela na medida exata em que o teste precisa. Ou seja, assim como nos filmes, nos testes também podemos usar dublês: o teste usa um componente muito parecido com o original em situações nas quais usar o componente original não seria possível ou seria caro demais, que é exatamente o nosso caso.

### Criando uma facade para o Phone

O primeiro passo é criar um componente que funcione como *facade* (fachada) para o `<Phone />` do Tangram. Ele simplesmente reexporta o componente original:

``` javascript
// src/components/Phone/Phone.js
import { Phone } from '@resultadosdigitais/tangram-components'

export default Phone
```

A partir daí, as telas da aplicação passam a importar o `<Phone />` a partir dessa *facade*, e não mais diretamente do Tangram:

``` diff
 import {
   Button,
   Form,
   Input,
-  Phone,
   TextArea,
 } from '@resultadosdigitais/tangram-components'
+import Phone from '@src/components/Phone'
```

Isso é importante porque, ao fazer o mock da *facade*, nenhum outro componente do Tangram é afetado. Fazer o mock do módulo `@resultadosdigitais/tangram-components` inteiro, por sua vez, faria com que todos os seus componentes deixassem de ser os reais na suite.

### Controlando a ativação do dublê

Em seguida, crie um mock capaz de alternar entre o dublê e o componente original:

``` javascript
// src/mocks/tangramPhone.js
import ActualPhone from '@src/components/Phone/Phone'

let isActive = false

// O dublê é um simples input, sem o select de país
const TangramPhoneDouble = ({
  value,
  onChange,
  defaultCountry,
  onClear,
  ...rest
}) => <input {...rest} defaultValue={value} />

// Renderiza o dublê ou o componente original,
// de acordo com o estado atual do mock
const TangramPhoneSwitch = props =>
  isActive ? <TangramPhoneDouble {...props} /> : <ActualPhone {...props} />

const tangramPhoneMock = {
  Component: TangramPhoneSwitch,
  activate: () => {
    isActive = true
  },
  deactivate: () => {
    isActive = false
  },
}

export default tangramPhoneMock
```

Note que o dublê vem desativado por padrão. Dessa forma, as suites que não ativarem o dublê explicitamente continuam usando o componente original.

Por fim, registre o mock da *facade* no arquivo `setupTests.js`, para que ele esteja disponível em todas as suites:

``` javascript
import mockTangramPhone from '@src/mocks/tangramPhone'

jest.mock('@src/components/Phone', () => mockTangramPhone.Component)
```

### Usando o dublê nos testes

Na suite da tela de perfil do usuário, o dublê é ativado antes de cada teste e desativado ao final de cada um deles. Dessa forma, os testes que precisam do componente original simplesmente desativam o dublê logo no início:

``` javascript
import tangramPhoneMock from '@src/mocks/tangramPhone'

describe('User Profile', () => {
  beforeEach(() => {
    tangramPhoneMock.activate()
  })

  afterEach(() => {
    tangramPhoneMock.deactivate()
  })

  it('should create a user profile', async () => {
    // Este teste usa o Phone original
    tangramPhoneMock.deactivate()
    // ...
  })

  it('should not submit if name is blank', async () => {
    // Este teste usa o dublê
    // ...
  })
})
```

## Garantindo o funcionamento do componente original

Mas atenção! Por mais tentador que seja ativar o dublê em todos os testes de uma suite, é imprescindível que haja ao menos um caso de uso que teste o funcionamento do componente original. Do contrário, a suite deixa uma brecha aberta para um possível bug: o dublê não formata o número, não adiciona o código do país e não dispara o `onChange` como o `<Phone />` do Tangram faz, de modo que uma integração quebrada com o componente real poderia passar despercebida.

Na suite de teste usada como exemplo nesta receita, o componente original é usado no primeiro teste da suite, que testa justamente o caminho feliz da tela e garante que o telefone enviado na requisição contém o código do país (`+551134335577`) adicionado pelo componente original.

## Benefícios

Com o dublê ativado, os testes da suite que não dependem do `<Phone />` original passaram a ser executados aproximadamente **10 vezes mais rápido**. Somados, os três casos de uso que usam o dublê caíram de cerca de 2,9 segundos para cerca de 0,3 segundo. Em uma única suite a diferença pode parecer pequena, mas na medida em que uma aplicação vai ganhando mais e mais telas com o `<Phone />`, o tempo economizado em toda a suite de testes se torna considerável.

Veja a seguir a duração média de cada teste da suite, com e sem o dublê:

| Teste | Com dublê | Sem dublê |
|---|---|---|
| should create a user profile (sempre usa o Phone real) | N/A | 3,8 s |
| should not submit if name is blank | 42 ms | 613 ms |
| should not submit if email is not valid | 155 ms | 1,35 s |
| should show error message on submit error | 98 ms | 910 ms |
| **Soma dos 3 testes com dublê** | **0,3 s** | **2,9 s** |

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/4a555e271fcc272538aa5e3343a07bb57ded1b75/packages/main/src/views/UserProfile/UserProfile.test.js).

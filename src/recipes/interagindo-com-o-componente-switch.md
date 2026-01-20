title: Interagindo com o componente Switch
date: 2026-01-20
description: Esta receia apresenta a maneira mais prática de interagir com o componente Switch em testes automatizados, utilizando role e label para garantir precisão e acessibilidade.
keywords: testes, tangram, select, role, checkbox, switch

---

Embora o Switch tenha um visual mais sofisticado que os elementos HTML nativos, por baixo dos panos ele não passa de um *checkbox*.

<p>
  <video autoplay loop playsinline muted>
    <source src="../media/notification-switch.mp4" type="video/mp4" />
  </video>  
</p>

Para interagir com um Switch nos testes, basta buscá-lo na tela através de seu *role* e *label*:

``` javascript
it('should optionally enable notifications', async () => {
  await mount()
  const { NotificationSwitch } = translation
  const switchEl = screen.getByRole('checkbox', {
    name: NotificationSwitch.Notifications,
  })
  await userEvent.click(switchEl)
  expect(switchEl).toBeChecked()
})
```

Ao usar *role* + *label* para obter o elemento, você é específico o suficiente e assim evita clicar em outro lugar da tela que eventualmente tenha o mesmo texto que o label do Switch (caso você use `getByText` ao invés de `getByRole`).

Importante notar que o *expect* deste teste é extremamente simples e garante tão somente que o Switch ficou ativo após receber o click. Em um projeto real é muito provável que você acabe garantindo que o Switch foi ativado verificando outros fatores, como por exemplo algum atributo enviado numa requisição ou o aparecimento de alguma seção da tela que só é exibida quando o Switch está ativo.

Você pode conferir a implementação completa deste teste [aqui](https://github.com/ResultadosDigitais/booblie/blob/897ae570e5e79cb56080f739e7322fdbb16238e3/packages/main/src/views/NotificationSwitch/NotificationSwitch.test.js).

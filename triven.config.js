module.exports = {
  title: 'Booblie',
  url: 'https://booblie.netlify.app',
  sourceDirectory: './src/recipes',
  outputDirectory: './dist',
  lang: 'pt-BR',
  homepagePostIntroType: 'description',
  translations: {
    'pt-BR': {
      availableRSSFeeds: 'RSS Feeds',
      newer: 'Página anterior',
      older: 'Próxima página',
      readMore: 'Continue lendo',
      rssFeed: 'Feed',
      rssFeeds: 'Feeds',
      seeAllPosts: 'Todas as receitas'
    }
  },
  formatters: {
    date: isoDateString => {
      const [year, month, day] = isoDateString.split('-');
      const date = new Date(parseInt(year), parseInt(month)-1, parseInt(day), 0);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return `Adicionada em ${Intl.DateTimeFormat('pt-BR', options).format(date)}`;
    }
  }
}

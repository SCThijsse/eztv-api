import axios from 'axios'
import cheerio from 'cheerio'
import debug from 'debug'

export default class EztvApi {
  constructor ({ baseUrl = 'https://eztv.ag/', name = 'eztv-api-pt' } = {}) {
    this.baseUrl = baseUrl
    this.debug = debug(name)
  }

  async get (endpoint, params = {}, raw = false) {
    const uri = `${this.baseUrl}${endpoint}`
    const opts = {
      params,
      responseType: raw ? 'json' : 'document'
    }

    this.debug('Making request to: %s %O', uri, params)
    const { data } = await axios.get(uri, opts)
    if (opts.responseType === 'json') {
      return data
    }

    return cheerio.load(data)
  }

  getEpisodeData (data, $) {
    let imdb = $('div[itemtype="http://schema.org/AggregateRating"]')
      .find('a[target="_blank"]')
      .attr('href')
    imdb = imdb ? imdb.match(/\/title\/(.*)\//)[1] : undefined
    if (imdb) {
      data.imdb = imdb
    }

    const table = 'tr.forum_header_border[name="hover"]'
    $(table).each((i_, el) => {
      const entry = $(el)
      const magnet = entry.children('td').eq(2)
        .children('a.magnet')
        .first()
        .attr('href')

      if (!magnet) {
        return
      }

      const seasonBased = /S?0*(\d+)[xE]0*(\d+)/i
      const dateBased = /(\d{4}).(\d{2}.\d{2})/i
      const title = entry.children('td').eq(1)
        .text()
        .replace('x264', '')
      let season
      let episode

      if (title.match(seasonBased)) {
        season = parseInt(title.match(seasonBased)[1], 10)
        episode = parseInt(title.match(seasonBased)[2], 10)
        data.dateBased = false
      } else if (title.match(dateBased)) {
        season = title.match(dateBased)[1]
        episode = title.match(dateBased)[2].replace(/\s/g, '-')
        data.dateBased = true
      } else {
        season = 0
        episode = 0
      }

      if (season && episode) {
        if (!data.episodes) {
          data.episodes = {}
        }

        if (!data.episodes[season]) {
          data.episodes[season] = {}
        }

        if (!data.episodes[season][episode]) {
          data.episodes[season][episode] = {}
        }

        const quality = title.match(/(\d{3,4})p/)
          ? title.match(/(\d{3,4})p/)[0]
          : '480p'

        const torrent = {
          url: magnet,
          seeds: 0,
          peers: 0,
          provider: 'EZTV'
        }

        if (
          !data.episodes[season][episode][quality] ||
          title.toLowerCase().indexOf('repack') > -1
        ) {
          data.episodes[season][episode][quality] = torrent
        }
      }
    })

    return data
  }

  getAllShows () {
    return this.get('showlist/').then($ => {
      const regex = /\/shows\/(.*)\/(.*)\//

      console.log($('.thread_link').length)
      return $('.thread_link').map((_, el) => {
        const entry = $(el)
        const href = entry.attr('href')

        return {
          show: entry.text(),
          id: parseInt(href.match(regex)[1], 10),
          slug: href.match(regex)[2]
        }
      }).get()
    })
  }

  getShowData (data) {
    return this.get(`shows/${data.id}/${data.slug}/`)
      .then($ => this.getEpisodeData(data, $))
  }

  getShowEpisodes (data) {
    return this.get('search/')
      .then($ => this.getEpisodeData(data, $))
  }

  getTorrents ({ page = 1, limit = 30, imdb } = {}) {
    const imdbId = (typeof imdb === 'string' && imdb.startsWith('tt'))
      ? imdb.substring(2, imdb.length)
      : imdb
    const params = {
      page,
      limit,
      imdb_id: imdbId
    }

    return this.get('api/get-torrents', params, true)
  }
}

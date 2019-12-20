import EztvApi from '../src/index'

describe('EztvApi', () => {
  let eztv, show, falseShow, dateBasedShow, noEpisodesShow, noMagnetShow

  beforeAll(() => {
    eztv = new EztvApi()

    show = {
      show: 'Dark Net',
      id: 1597,
      slug: 'dark-net'
    }
    falseShow = {
      show: 'False Show Name',
      id: 12345,
      slug: 'false-show-name'
    }
    dateBasedShow = {
      show: '60 Minutes US',
      id: 817,
      slug: '60-minutes-us'
    }
    noEpisodesShow = {
      show: '2010 Vancouver Winter Olympics',
      id: 350,
      slug: '2010-vancouver-winter-olympics'
    }
    noMagnetShow = {
      show: 'Grimm',
      id: 556,
      slug: 'grimm'
    }
  })

  function testShowAttributes (show) {
    expect(show).toBeDefined()
    expect(show).toHaveProperty('show')
    expect(show).toHaveProperty('id')
    expect(show).toHaveProperty('slug')
  }

  function testGetTorrentsAttributes (res) {
    expect(res).toBeDefined()
    expect(res).toHaveProperty('torrents_count')
    expect(res).toHaveProperty('limit')
    expect(res).toHaveProperty('page')

    expect(res).toHaveProperty('torrents')
    expect(res.torrents.length).toBeGreaterThanOrEqual(1)
    testTorrentAttributes(res.torrents)
  }

  function testTorrentAttributes (torrents) {
    const random = Math.floor(Math.random() * torrents.length)
    const toTest = torrents[random]

    expect(toTest).toHaveProperty('id')
    expect(toTest).toHaveProperty('hash')
    expect(toTest).toHaveProperty('filename')
    expect(toTest).toHaveProperty('episode_url')
    expect(toTest).toHaveProperty('torrent_url')
    expect(toTest).toHaveProperty('magnet_url')
    expect(toTest).toHaveProperty('title')
    expect(toTest).toHaveProperty('imdb_id')
    expect(toTest).toHaveProperty('season')
    expect(toTest).toHaveProperty('episode')
    expect(toTest).toHaveProperty('small_screenshot')
    expect(toTest).toHaveProperty('large_screenshot')
    expect(toTest).toHaveProperty('seeds')
    expect(toTest).toHaveProperty('peers')
    expect(toTest).toHaveProperty('date_released_unix')
    expect(toTest).toHaveProperty('size_bytes')
  }

  it('should get a list of tv shows', done => {
    eztv.getAllShows().then(res => {
      expect(res.length).toBeGreaterThanOrEqual(1)

      const random = Math.floor(Math.random() * res.length)
      testShowAttributes(res[random])

      done()
    }).catch(done)
  })

  it('should get a show', done => {
    eztv = new EztvApi()
    eztv.getShowData(show).then(res => {
      testShowAttributes(res)
      expect(res).toHaveProperty('imdb')
      expect(res).toHaveProperty('episodes')

      done()
    }).catch(done)
  })

  it('should search for a show', done => {
    eztv.getShowEpisodes(show).then(res => {
      testShowAttributes(res)
      expect(res).toHaveProperty('episodes')

      done()
    }).catch(done)
  })

  it('should get a date based show', done => {
    eztv.getShowData(dateBasedShow).then(res => {
      testShowAttributes(res)
      expect(res).toHaveProperty('imdb')
      expect(res).toHaveProperty('episodes')

      done()
    }).catch(done)
  })

  it('should get a show with no episodes', done => {
    eztv.getShowData(noEpisodesShow).then(res => {
      testShowAttributes(res)
      expect(res).toHaveProperty('imdb')
      expect(res.episodes).toBeUndefined()

      done()
    }).catch(done)
  })

  it('should get a show with no magnet links', done => {
    eztv.getShowData(noMagnetShow).then(res => {
      testShowAttributes(res)
      expect(res).toHaveProperty('imdb')
      expect(res).toHaveProperty('episodes')

      done()
    }).catch(done)
  })

  it('should fail to get a show', done => {
    eztv.getShowData(falseShow).then(done).catch(err => {
      expect(err).toBeInstanceOf(Error)
      done()
    })
  })

  it('should get a list of torrents', done => {
    eztv.getTorrents({
      page: 1,
      limit: 10,
      imdb: '6048596'
    }).then(res => {
      testGetTorrentsAttributes(res)
      expect(res).toHaveProperty('imdb_id')

      done()
    }).catch(done)
  })

  it('should get a list of torrents with a standard imdb id', done => {
    eztv.getTorrents({
      imdb: 'tt6048596'
    }).then(res => {
      testGetTorrentsAttributes(res)
      expect(res).toHaveProperty('imdb_id')

      done()
    }).catch(done)
  })

  it('should get a list of torrents with the default parameters', done => {
    eztv.getTorrents().then(res => {
      testGetTorrentsAttributes(res)
      expect(res.imdb_id).toBeUndefined()

      done()
    }).catch(done)
  })
})

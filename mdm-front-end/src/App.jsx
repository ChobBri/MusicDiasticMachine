import { useState, useEffect } from 'react'
import axios from 'axios'
import { htmlToText } from 'html-to-text'
import Speech from 'speak-tts'
import './App.css'

const getTfIdfWord = (songs, index) => {
  let songWordCount = []
  let allWordMap = new Map()
  songs.forEach( song => {
    let wordMap = new Map()
    const text = htmlToText(song.body.html)
    const pattern = /[^()\[\]]+(?![^\[]*\])(?![^()]*\))/g
    console.log(text)
    const lyrics = text.match(pattern).join('').toLowerCase().split(/(?:\n| )+/)
    lyrics.forEach( word => {
      if (wordMap.hasOwnProperty(word)) {
        wordMap[word]++
      }
      else 
      {
        wordMap.set(word, 1)
      }

      if (allWordMap.has(word)) {
        allWordMap.set(word, allWordMap.get(word)+1);
      }
      else 
      {
        allWordMap.set(word, 1)
      }
    })

    songWordCount.push(wordMap)
  })

  const wordList = []
  for (const word of songWordCount[index]) {
    wordList.push(word[0])
  }

  console.log(wordList)
  const wordfres = wordList.map(word => console.log(allWordMap))

  const tf = wordList.map(word => songWordCount[index].get(word) / allWordMap.get(word))
  const df = wordList.map(word => {
    let count = 0
    songWordCount.forEach(wordCount => {
      count = wordCount.has(word) ? count + 1 : count
    })

    return count
  })

  const tfidf = wordList.map((word, i) => tf[i] * Math.log(wordList.length / df[i]))

  const maxInd = tfidf.indexOf(Math.max(...tfidf))

  return wordList[maxInd]
}

const Poem = ({ title, content }) => {
  const styleObject = {
    fontFamily: 'cursive',
    fontWeight: 400,
    fontStyle: 'normal',
  }
  const textsPerLine = content.split('\n')
  const retContent = textsPerLine.map((t, i) => {
    return <p key={i}>{t}</p>
  })

  return (
    <div style={styleObject}>
      <h2>{title}</h2>
      {retContent}
    </div>
  )
}

const App = () => {
  const [songInput, setSongInput] = useState('')
  const [poem, setPoem] = useState(null)
  const [poems, setPoems] = useState([])

  useEffect(() => {
    axios.get('http://localhost:3000/api/poems')
      .then(response => {
        setPoems(response.data)
      })
  }, [])

  const handleSongSearch = (event) => {
    event.preventDefault()

    const songoptions = {
      method: 'GET',
      url: 'https://genius-song-lyrics1.p.rapidapi.com/search/',
      params: {
        q: songInput,
        per_page: '1',
        page: '1',
      },
      headers: {
        'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
        'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com',
      }
    }
    
    axios.request(songoptions).then(songresponse => {
      console.log('songoptions')
      console.log(songresponse.data)
      const newsong = {}
      newsong.data = songresponse.data.hits[0]

      const songdetoptions = {
        method: 'GET',
        url: 'https://genius-song-lyrics1.p.rapidapi.com/song/details/',
        params: {id: newsong.data.result.id},
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
          'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com'
        }
      }
      
      let albumId = 0
      axios.request(songdetoptions).then(songdetresponse => {
        console.log('songdetoptions')
        console.log(songdetresponse.data)

        albumId = songdetresponse.data.song.album.id

        const albumoptions = {
          method: 'GET',
          url: 'https://genius-song-lyrics1.p.rapidapi.com/album/appearances/',
          params: {
            id: albumId,
            per_page: '5',
            page: '1'
          },
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
            'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com'
          }
        }
        axios.request(albumoptions).then(async albumresponse => {
          console.log('albumresponse')
          console.log(albumresponse.data)
  
          const albumAppearances = albumresponse.data.album_appearances
          console.log(albumAppearances)
          const songs = []
          let songIndex = 0

          for (let i = 0; i < albumAppearances.length; i++) {
            const song = albumAppearances[i]
            console.log(song.song.id)
            console.log(songresponse.data.hits[0].result.id)
            console.log(song)

            if (song.song.id === songresponse.data.hits[0].result.id) {
              songIndex = i
            }
            const lyricsoptions = {
              method: 'GET',
              url: 'https://genius-song-lyrics1.p.rapidapi.com/song/lyrics/',
              params: {id: song.song.id},
              headers: {
                'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
                'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com'
              }
            }
            
            const lyricsresponse = await axios.request(lyricsoptions)
            console.log('lyricsresponse')
            console.log(lyricsresponse.data)

            songs.push(lyricsresponse.data.lyrics.lyrics)
          }
          
          console.log(songs)
          setPoem({title: getTfIdfWord(songs, songIndex), content: generatePoem(songs[songIndex])})
        })
      })
    })
  }

  const generatePoem = songlyrics => {
    const text = htmlToText(songlyrics.body.html)
    const pattern = /[^()\[\]]+(?![^\[]*\])(?![^()]*\))/g
    const lyrics = text.match(pattern).join('').toLowerCase().split(/(?:\n| )+/)
    let lyricsIndex = 0;
    const newPoem = []
    let charIndex = 0
    for (let i = 0; i < songInput.length; i++) {

      for (; lyricsIndex < lyrics.length; lyricsIndex++)
      {
        if (songInput[i] === ' ') break
        
        if (lyrics[lyricsIndex].toLowerCase().charAt(charIndex) === songInput[i].toLowerCase()) {
          const wordToAdd = (charIndex === 0 ?
                           lyrics[lyricsIndex].charAt(0).toUpperCase() :
                           lyrics[lyricsIndex].charAt(0).toLowerCase())
                          + lyrics[lyricsIndex].slice(1)

          newPoem.push(wordToAdd)
          lyricsIndex++
          break
        }
      }

      charIndex++
      
      if (songInput[i] === ' ') {
        newPoem.push('\n')
        charIndex = 0
      }
    }


    console.log(newPoem)

    const newFullPoem = newPoem.join(' ')
    // speakPoem(newFullPoem)
    console.log(newFullPoem)
    return newFullPoem
  }

  const songSearchForm = () => {
    return(
      <>
        <form onSubmit={handleSongSearch}>
          Song name
          <input
            type="text"
            value={songInput}
            name="Song"
            onChange={({target}) => setSongInput(target.value)}
          ></input>
        <button type="submit">Search</button>
        </form>
      </>
    )
  }

  const poemView = () => {

    if (poem === null) { 
      return (<p></p>)
    }

    const addPoem = (event) => {
      event.preventDefault()

      const postPoem = {
        title: poem.title,
        content: poem.content,
      }
      axios.post('http://localhost:3000/api/poems', postPoem)
      .then(data => {         
        const newPoem = data
        setPoems(poems.concat(newPoem))
        setSongInput('')
      })
      .catch(e => console.log(e))
    }
    
    return (
      <>
        <Poem title={poem.title} content={poem.content} />
        <form onSubmit={addPoem}>
          <button type="submit">save</button>
        </form>  
      </>
    )
  }

  const deletePoem = (id) => {
    axios.delete(`http://localhost:3000/api/poems/${id}`)
    .then(data => {         
      const newPoems = poems.filter(p => p.id !== id)
      setPoems(newPoems)
    })
    .catch(e => console.log(e))
  }

  return (
    <>
      <h1>Music Diastic Machine</h1>
      {songSearchForm()}
      {poemView()}
      <hr></hr>
      {poems.map(p => {
        const styleObject = {
          fontFamily: 'cursive',
          fontWeight: 200,
          fontStyle: 'normal',
        }
        return (
        <div>
          <div style={styleObject}>
            <h3>{p.title}</h3>
            {p.content.split('\n').map((t, i) => { return (<p key={i}>{t}</p>) })}
          </div>
          <button onClick={() => deletePoem(p.id)}>delete</button>
        </div>
        )
      })}
    </>
  )
}

export default App

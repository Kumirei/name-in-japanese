import './App.css'
import * as React from 'react'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import nameInJapanese from './yourname'

function App() {
    const [name, setName] = React.useState('')

    const processAfterMs = 500
    let timeout = 0
    let lastInput = 0
    function handleInputChange(event, b, c) {
        if ((event.timeStamp - lastInput) / 1000 < processAfterMs / 100) {
            clearTimeout(timeout)
            timeout = setTimeout(async () => {
                console.log('timeout', event.target.value)
                const japaneseName = await nameInJapanese(event.target.value)
                setName(japaneseName)
            }, processAfterMs)
        }
        lastInput = event.timeStamp
    }

    return (
        <div className='App'>
            <header>
                <Typography variant='h6' gutterBottom component='h1'>
                    Your Name In Japanese
                </Typography>
            </header>
            <TextField fullwidth onChange={handleInputChange} id='outlined-basic' label='Outlined' variant='outlined' />
            <Typography variant='p' gutterBottom component='p'>
                Your name is {name}
            </Typography>
        </div>
    )
}

export default App

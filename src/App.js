import './App.css'
import * as React from 'react'
// Material UI
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import Toolbar from '@mui/material/Toolbar'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Paper from '@mui/material/Paper'
import { DataGrid } from '@mui/x-data-grid'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import { createTheme, ThemeProvider } from '@mui/material/styles'
// import { ThemeProvider, createTheme } from '@mui/system'
// My stuffs
import getJapaneseNames from './yourname'
import { Container } from '@mui/material'

const default_data = [
    { names: [{ name: 'Your', freq: 1, articles: [] }] },
    { names: [{ name: 'Name', freq: 1, articles: [] }] },
]

const theme = createTheme({
    palette: {
        primary: { main: '#000', accent: 'hsl(300, 20%, 50%)', link: 'hsl(300, 60%, 40%)' },
        secondary: { main: '#fff' },
        background: {
            main: '#999',
            paper: '#999',
            dark: '#888',
            separators: '#666',
        },
    },
})

function App() {
    const [data, setData] = React.useState(default_data) // Data about names
    const [selected, setSelected] = React.useState({ name: '', spelling: '' }) // Keep track of what data is selected for the table

    // Wait until user stops typing then initiate processing
    const processInputAfterMs = 500
    let timeout = 0
    let lastInput = 0
    function handleInputChange(event) {
        if ((event.timeStamp - lastInput) / 1000 < processInputAfterMs / 100) {
            clearTimeout(timeout)
            timeout = setTimeout(async () => {
                const dataPromise = getJapaneseNames(event.target.value)
                setData(
                    event.target.value
                        .split(/\s/)
                        .map((n) => ({ names: [{ name: 'Loading...', freq: 0, articles: [] }] })),
                ) // Set data to show 'Loading...' on the cards while fetching
                const data = await dataPromise
                setData(data)
                setSelected({ name: 0, spelling: 0 })
            }, processInputAfterMs)
        }
        lastInput = event.timeStamp
    }

    // Upadate selected variable with new data
    const handleSelectedChange = (update) => {
        setSelected({ ...selected, ...update })
    }

    // Column template for table
    const columns = [
        { field: 'id', headerName: '#', flex: 0, width: 60 },
        { field: 'ja', headerName: 'Japanese', flex: 1 },
        { field: 'en', headerName: 'English', flex: 1 },
        {
            field: 'link',
            headerName: 'Wikipedia',
            flex: 0,
            sortable: false,
            renderCell: (params) => (
                <Link
                    href={`https://en.wikipedia.org/?curid=${params.value}`}
                    sx={{ color: 'primary.link', textDecorationColor: 'hsl(300, 60%, 40%)' }}
                >
                    Link
                </Link>
            ),
        },
    ]

    // The data for the table
    const rows =
        data[selected.name || 0].names[selected.spelling || 0]?.articles.map((r, i) => ({
            ...r,
            id: i + 1,
            link: r.id,
        })) ?? {}

    return (
        <ThemeProvider theme={theme}>
            <Container className='App' sx={{ textAlign: 'center' }}>
                <Box component='header' sx={{ pt: '1em', color: 'secondary.main' }}>
                    <Typography variant='h3' gutterBottom component='h1'>
                        Your Name In Japanese
                    </Typography>
                </Box>
                <Container component='section' style={{ maxWidth: '1024px' }}>
                    <TextField
                        className='search'
                        fullWidth
                        onChange={handleInputChange}
                        label='Your name'
                        placeholder='John Doe'
                        color='secondary'
                        sx={{
                            '.MuiOutlinedInput-root': { backgroundColor: 'background.main' },
                            '.MuiInputLabel-shrink': { color: 'secondary.main' },
                            '&:is(*, :hover) .MuiOutlinedInput-notchedOutline': { borderColor: 'secondary.main' },
                        }}
                    />
                    <Stack
                        sx={{ my: '1em', flexWrap: 'wrap' }}
                        direction='row'
                        justifyContent='space-evenly'
                        alignItems='flex-start'
                    >
                        {data.map((d) => (
                            <Card sx={{ minWidth: '15em', backgroundColor: 'primary.accent', m: '5px' }}>
                                <CardContent>
                                    <Typography variant='h5' gutterBottom component='h5'>
                                        {d.names[0]?.name ?? 'Unknown'}
                                    </Typography>
                                    <Typography
                                        sx={{ fontSize: '0.75em', mb: '0.5em', mt: '-0.5em' }}
                                        variant='p'
                                        component='p'
                                    >
                                        Found {d.names[0]?.articles.length ?? 0} times
                                    </Typography>
                                    <Typography variant='p' gutterBottom component='p' align='left'>
                                        Alternatives include:
                                    </Typography>
                                    {d.names?.filter((n) => n.freq > 1).length < 2 ? (
                                        <Typography
                                            sx={{ fontSize: '0.8em' }}
                                            variant='p'
                                            gutterBottom
                                            component='p'
                                            align='left'
                                        >
                                            None
                                        </Typography>
                                    ) : (
                                        d.names
                                            .filter((n, i) => i !== 0 && n.freq > 1)
                                            .slice(0, 3)
                                            .map((n) => (
                                                <Typography
                                                    sx={{ fontSize: '0.8em' }}
                                                    variant='p'
                                                    gutterBottom
                                                    component='p'
                                                    align='left'
                                                >
                                                    {n.name} found {n.articles.length} times
                                                </Typography>
                                            ))
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                    <Paper className='articles' sx={{ border: '1px solid white' }}>
                        <Toolbar
                            sx={{
                                justifyContent: 'left',
                                display: 'flex',
                                flexWrap: 'wrap',
                                py: '5px',
                                gap: '1em',
                            }}
                        >
                            <Box className='row' sx={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
                                <Typography variant='h6' component='div' sx={{ minWidth: '260px' }}>
                                    Show Wikipedia articles with
                                </Typography>
                                <FormControl sx={{ minWidth: '100px' }} variant='standard'>
                                    <Select
                                        label='Name'
                                        onChange={(event) =>
                                            handleSelectedChange({ name: event.target.value, spelling: 0 })
                                        }
                                        value={selected.name}
                                    >
                                        {data.map((d, i) => (
                                            <MenuItem value={i}>{d?.enName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box className='row' sx={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
                                <Typography variant='h6' component='div' sx={{ minWidth: '90px' }}>
                                    written as
                                </Typography>
                                <FormControl sx={{ minWidth: '100px' }} variant='standard'>
                                    <Select
                                        label='Name'
                                        onChange={(event) => handleSelectedChange({ spelling: event.target.value })}
                                        value={selected.spelling}
                                    >
                                        {data[selected.name]?.names
                                            .filter((n) => n.freq > 1)
                                            .slice(0, 4)
                                            .map((n, i) => (
                                                <MenuItem value={i}>{n.name}</MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Toolbar>
                        <Box
                            sx={{
                                '.MuiDataGrid-root': {
                                    border: 'none',
                                    '& .MuiDataGrid-columnHeaders': { borderTop: 1 },
                                    '& :is(.MuiDataGrid-cell, .MuiDataGrid-columnHeaders)': {
                                        borderColor: 'primary.main',
                                    },
                                    '& .MuiDataGrid-iconSeparator': { fill: '#666' },
                                    '& :is(.MuiDataGrid-columnHeaders, .MuiDataGrid-row:nth-child(2n-2))': {
                                        background: '#888',
                                    },
                                },
                            }}
                        >
                            <DataGrid rows={rows} columns={columns} pageSize={10} rowHeight={38} autoHeight />
                        </Box>
                    </Paper>
                </Container>
            </Container>
        </ThemeProvider>
    )
}

export default App

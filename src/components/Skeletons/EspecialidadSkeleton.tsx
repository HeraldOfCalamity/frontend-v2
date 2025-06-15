import { Box, Card, CardContent, Skeleton } from "@mui/material";


export default function EspecialidadSkeleton(){
    return(
        <Box p={2}>
            <Card elevation={7} sx={{height:350}}>
                <CardContent>
                    <Skeleton variant="rectangular" height={140} sx={{pb: 2}}/>
                    <Skeleton variant="text" sx={{fontWeight: 600, fontSize: "1.5rem", pb:2}} />
                    <Skeleton variant="text"/>
                    <Skeleton variant="text"/>
                    <Skeleton variant="text" width={"70%"}/>
                </CardContent>
            </Card>
        </Box>
    )
}
import { View, Text ,Button} from 'react-native'
import React, { useState } from 'react'

const product = () => {

    const [visible, setVisible] = useState(false)
    return (
        <View>
            <Text>product</Text>
            <Button title='Click' />
            {
                visible ? <Text>Clicked </Text> : <Text>Clicked Back</Text>
            }
        </View>
    )
}

export default product
import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { Button } from '@react-navigation/elements'

const product = () => {

    const [visible, setVisible] = useState(false)
    return (
        <View>
            <Text>product</Text>
            <Button >Click</Button>
            {
                visible ? <Text>Clicked </Text> : <Text>Clicked Back</Text>
            }
        </View>
    )
}

export default product
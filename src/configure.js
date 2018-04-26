import AWS from 'aws-sdk'

export const configure = ({ region }) => {
    AWS.config.region = region;
}
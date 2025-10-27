import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

interface UseGetData {
    isLoading: boolean,
    selectedInstance: any,
    availableParameters: string[],
    selectedTime: string | null,
    trajectory: any
}

interface UseGetDataParameters {
    baseurl: string,
    parameter: string|null,
    coordsWKT: string,
    coarseData: boolean
}

interface FetchInstancesParameters {
    queryKey: [
        'instances',
        {
            baseurl: string
        }
    ]
}

// Access the key, status and page variables in your query function!
async function fetchInstances({ queryKey }: FetchInstancesParameters) {
    const { baseurl } = queryKey[1];

    const instancesResponse = await fetch(`${baseurl}/instances`)
    const instances = await instancesResponse.json();

    instances.instances.sort((a: any, b: any) => a.id < b.id ? 1 : -1);

    return instances;
}

interface FetchDataParameters {
    queryKey: [
        'data',
        {
            parameter: string|null,
            coordsWKT: string,
            mode: 'COARSE' | 'FULL',
            selectedInstance: any,
            baseurl: string
        }
    ]
}

async function fetchData({ queryKey }: FetchDataParameters) {
    const { parameter, coordsWKT, mode, selectedInstance, baseurl } = queryKey[1];

    if (!selectedInstance || !parameter) return null;

    const datetime = selectedInstance ? selectedInstance.extent.temporal.interval[0][0]! : null;

    const qs = new URLSearchParams();
    qs.append('parameter-name', parameter)
    qs.append('datetime', datetime)
    qs.append('crs', 'CRS:84')
    qs.append('coords', coordsWKT);

    if (mode === 'COARSE') {
        qs.append('z', selectedInstance.extent.verticalValues.filter((_v: number, idx: number) => idx % 4 === 0).join(','))
    } else if (mode === 'FULL') {
        qs.append('z', selectedInstance.extent.vertical.values.join(','))
    }
    qs.append('f', 'CoverageJSON')

    const trajectoryResponse = await fetch(`${baseurl}/instances/${selectedInstance.id}/trajectory?${qs.toString()}`)
    const trajectory = await trajectoryResponse.json();

    return {
        datetime,
        trajectory
    };
}

export const useGetData = ({baseurl, parameter, coordsWKT, coarseData}: UseGetDataParameters): UseGetData => {
    const [isLoading, setIsLoading] = useState(false);
    const [availableParameters, setAvailableParameters] = useState<string[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<any>(null);
    const [trajectory, setTrajectory] = useState(null);
    const [selectedTime, setSelectedTime] = useState<string|null>(null)
    
    const instancesResponse = useQuery({
        queryKey: ['instances', { baseurl }],
        queryFn: fetchInstances,
    })

    useEffect(() => {
        if (instancesResponse.isPending) {
            setAvailableParameters([]);
            setSelectedInstance(null);
            return;
        }
        if (instancesResponse.isSuccess && instancesResponse.data) {
            const selectedInstance = instancesResponse.data.instances[0];

            setSelectedInstance(selectedInstance);
            setAvailableParameters(Object.keys(selectedInstance.parameter_names));
        }
    }, [instancesResponse.isPending, instancesResponse.isSuccess, instancesResponse.data])

    const dataResponse = useQuery({
        queryKey: [
            'data',
            {
                parameter,
                coordsWKT,
                mode: coarseData ? 'COARSE' : 'FULL',
                selectedInstance,
                baseurl
            }
        ],
        queryFn: fetchData
    });

    useEffect(() => {
        setIsLoading(dataResponse.isPending)

        if (dataResponse.isSuccess && dataResponse.data) {
            setSelectedTime(dataResponse.data.datetime);
            setTrajectory(dataResponse.data.trajectory as any);
        }
    }, [dataResponse.isPending, dataResponse.isSuccess, dataResponse.data])

    return {
        isLoading,
        selectedInstance,
        availableParameters,
        selectedTime,
        trajectory
    }
}
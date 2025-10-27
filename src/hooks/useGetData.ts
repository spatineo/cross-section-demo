import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

interface UseGetData {
    isLoading: boolean,
    selectedInstance: any,
    selectedTime: string|null,
    availableParameters: string[],
    trajectory: any
}

interface UseGetDataParameters {
    baseurl: string,
    parameter: string|null,
    coordsWKT: string,
    coarseData: boolean
}

// Access the key, status and page variables in your query function!
async function fetchInstances({ queryKey }) {
    const { baseurl } = queryKey[1];

    const instancesResponse = await fetch(`${baseurl}/instances`)
    const instances = await instancesResponse.json();

    instances.instances.sort((a: any, b: any) => a.id < b.id ? 1 : -1);

    return instances;
}

export const useGetData = ({baseurl, parameter, coordsWKT, coarseData}: UseGetDataParameters): UseGetData => {
    const [isLoading, setIsLoading] = useState(false);
    const [availableParameters, setAvailableParameters] = useState<string[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<any>(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    
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

    useEffect(() => {
        if (!selectedInstance || !parameter) return;

        const retrieveTrajectory = async () => {
            setIsLoading(true);

            const datetime = selectedInstance.extent.temporal.interval[0][0]!;

            const qs = new URLSearchParams();
            qs.append('parameter-name', parameter)
            qs.append('datetime', datetime)
            qs.append('crs', 'CRS:84')
            qs.append('coords', coordsWKT);

            if (coarseData) {
                qs.append('z', selectedInstance.extent.vertical.values.filter((_v: number, idx: number) => idx % 4 === 0).join(','))
            } else {
                qs.append('z', selectedInstance.extent.vertical.values.join(','))
            }
            qs.append('f', 'CoverageJSON')

            const trajectoryResponse = await fetch(`${baseurl}/instances/${selectedInstance.id}/trajectory?${qs.toString()}`)
            const trajectory = await trajectoryResponse.json();

            setSelectedTime(datetime);
            setTrajectory(trajectory);
            setIsLoading(false);
        }

        retrieveTrajectory();

    }, [baseurl, selectedInstance, parameter, coordsWKT, coarseData])

    return {
        isLoading,
        selectedInstance,
        selectedTime,
        availableParameters,
        trajectory
    }
}
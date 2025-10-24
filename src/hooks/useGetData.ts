import { useEffect, useState } from "react"

export const useGetData = (baseurl: string, parameter: string|null, coordsWKT: string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [availableParameters, setAvailableParameters] = useState<string[]>([]);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    
    useEffect(() => {
        const retrieveInstances = async () => {
            const instancesResponse = await fetch(`${baseurl}/instances`)
            const instances = await instancesResponse.json();

            instances.instances.sort((a: any, b: any) => a.id < b.id ? 1 : -1);

            const selectedInstance = instances.instances[0];

            setSelectedInstance(selectedInstance);
            setAvailableParameters(Object.keys(selectedInstance.parameter_names));
        }

        retrieveInstances();
    }, [baseurl]);

    useEffect(() => {
        if (!selectedInstance || !parameter) return;

        const retrieveTrajectory = async () => {
            setIsLoading(true);

            const datetime = selectedInstance.extent.temporal.interval[0][0]!;

            const qs = new URLSearchParams();
            qs.append('parameter-name', parameter)
            qs.append('datetime', datetime)
            qs.append('crs', 'CRS:84')
            //qs.append('coords', 'LINESTRING(7 66.2,8 66.2,9 66.2,10 66.2,11 66.2,12 66.2,12 66.2,13 66.2,14 66.2,15 66.2,16 66.2,17 66.2,18 66.2,19 66.2,20 66.2,21 66.2,22 66.2)');
            qs.append('coords', coordsWKT);
            qs.append('z', selectedInstance.extent.vertical.values.join(','))
            qs.append('f', 'CoverageJSON')

            const trajectoryResponse = await fetch(`${baseurl}/instances/${selectedInstance.id}/trajectory?${qs.toString()}`)
            const trajectory = await trajectoryResponse.json();

            setSelectedTime(datetime);
            setTrajectory(trajectory);
            setIsLoading(false);
        }

        retrieveTrajectory();

    }, [baseurl, selectedInstance, parameter, coordsWKT])

    return {
        isLoading,
        selectedInstance,
        selectedTime,
        availableParameters,
        trajectory
    }
}
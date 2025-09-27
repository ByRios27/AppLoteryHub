
export const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i % 12 === 0 ? 12 : i % 12;
            const period = i < 12 ? 'AM' : 'PM';
            const time = `${String(hour).padStart(2, '0')}:${String(j).padStart(2, '0')} ${period}`;
            slots.push(time);
        }
    }
    return slots;
};
